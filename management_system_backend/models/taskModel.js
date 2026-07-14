const pool = require("../db");
const { parseSort } = require("../utils/queryBuilder");
const {
  taskVariance,
  addHoursToDate,
} = require("../services/calculationService");
const {
  calculateElapsedHours,
  pauseTask,
  holdTask,
  resumeTask,
  completeTask,
  FROZEN_STATUSES,
} = require("../services/taskTimerService");

const mapTask = (row) => ({
  id: row.id,
  project_id: row.project_id,
  project_name: row.project_name,
  assigned_to: row.assigned_to,
  assigned_to_name: row.assigned_to_name,
  name: row.name,
  details: row.details,
  complexity: row.complexity,
  priority: row.priority,
  start_time: row.start_time,
  estimated_hours: Number(row.estimated_hours),
  deadline: row.deadline,
  actual_hours: row.actual_hours !== null ? Number(row.actual_hours) : null,
  variance:
    row.actual_hours !== null
      ? taskVariance(row.actual_hours, row.estimated_hours)
      : null,
  status: row.status,
  paused_at: row.paused_at,
  total_paused_hours: Number(row.total_paused_hours || 0),
  completed_at: row.completed_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const TASK_SELECT = `
  SELECT t.*, p.name AS project_name, tm.full_name AS assigned_to_name
  FROM tasks t
  LEFT JOIN projects p ON t.project_id = p.id
  LEFT JOIN team_members tm ON t.assigned_to = tm.id
`;

const buildTaskWhere = (query) => {
  const conditions = [];
  const values = [];
  let index = 1;

  if (query.search) {
    conditions.push(`(t.name ILIKE $${index} OR t.details ILIKE $${index})`);
    values.push(`%${query.search}%`);
    index += 1;
  }
  if (query.projectId) {
    conditions.push(`t.project_id = $${index}`);
    values.push(query.projectId);
    index += 1;
  }
  if (query.developerId) {
    conditions.push(`t.assigned_to = $${index}`);
    values.push(query.developerId);
    index += 1;
  }
  if (query.status) {
    conditions.push(`t.status = $${index}`);
    values.push(query.status);
    index += 1;
  }
  if (query.complexity) {
    conditions.push(`t.complexity = $${index}`);
    values.push(query.complexity);
    index += 1;
  }
  if (query.priority) {
    conditions.push(`t.priority = $${index}`);
    values.push(query.priority);
    index += 1;
  }
  if (query.startDate) {
    conditions.push(`t.start_time >= $${index}`);
    values.push(query.startDate);
    index += 1;
  }
  if (query.endDate) {
    conditions.push(`t.start_time <= $${index}`);
    values.push(query.endDate);
    index += 1;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, values };
};

const findAll = async (query = {}) => {
  const { whereClause, values } = buildTaskWhere(query);
  const sort = parseSort(
    query.sort,
    {
      name: "t.name",
      status: "t.status",
      priority: "t.priority",
      complexity: "t.complexity",
      start_time: "t.start_time",
      deadline: "t.deadline",
      created_at: "t.created_at",
    },
    "t.created_at DESC"
  );

  const result = await pool.query(
    `${TASK_SELECT} ${whereClause} ORDER BY ${sort}`,
    values
  );
  return result.rows.map(mapTask);
};

const findById = async (id) => {
  const result = await pool.query(`${TASK_SELECT} WHERE t.id = $1`, [id]);
  return result.rows[0] ? mapTask(result.rows[0]) : null;
};

const findByProjectId = async (projectId) => {
  const result = await pool.query(
    `${TASK_SELECT} WHERE t.project_id = $1 ORDER BY t.created_at DESC`,
    [projectId]
  );
  return result.rows.map(mapTask);
};

const create = async (data) => {
  const startTime = data.start_time ? new Date(data.start_time) : new Date();
  const useNow = data.use_current_time !== false && !data.start_time;
  const actualStart = useNow ? new Date() : startTime;
  const status =
    data.status || (useNow ? "in_progress" : "not_started");
  const deadline = addHoursToDate(actualStart, data.estimated_hours);

  const result = await pool.query(
    `INSERT INTO tasks (
      project_id, assigned_to, name, details, complexity, priority,
      start_time, estimated_hours, deadline, status, actual_hours
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id`,
    [
      data.project_id,
      data.assigned_to || null,
      data.name,
      data.details || null,
      data.complexity || "medium",
      data.priority || "medium",
      actualStart,
      data.estimated_hours,
      deadline,
      status,
      data.actual_hours ?? null,
    ]
  );

  return findById(result.rows[0].id);
};

const update = async (id, data) => {
  const existing = await findById(id);
  if (!existing) return null;

  const startTime = data.start_time ? new Date(data.start_time) : existing.start_time;
  const estimatedHours =
    data.estimated_hours !== undefined
      ? data.estimated_hours
      : existing.estimated_hours;

  const assignedTo =
    data.assigned_to !== undefined ? data.assigned_to : existing.assigned_to;
  const details =
    data.details !== undefined ? data.details : existing.details;

  // Deadline (PDF 10.11 / 11.4): manual end time wins; otherwise recompute
  // when start/estimated change, preserving any pause extension (PDF 11.3).
  const startChanged =
    data.start_time !== undefined &&
    new Date(data.start_time).getTime() !==
      new Date(existing.start_time || 0).getTime();
  const estimatedChanged =
    data.estimated_hours !== undefined &&
    Number(data.estimated_hours) !== Number(existing.estimated_hours);

  let deadline;
  if (data.deadline !== undefined) {
    deadline = data.deadline;
  } else if (startChanged || estimatedChanged) {
    const newBase = addHoursToDate(startTime, estimatedHours);
    if (existing.start_time && existing.deadline && existing.estimated_hours != null) {
      const oldBase = addHoursToDate(
        existing.start_time,
        existing.estimated_hours
      );
      const extensionMs =
        new Date(existing.deadline).getTime() - new Date(oldBase).getTime();
      deadline =
        extensionMs > 0
          ? new Date(newBase.getTime() + extensionMs)
          : newBase;
    } else {
      deadline = newBase;
    }
  } else {
    deadline = existing.deadline;
  }

  let actualHours = data.actual_hours;
  let completedAt = existing.completed_at;
  let pausedAt = existing.paused_at;
  let totalPausedHours = existing.total_paused_hours;
  let nextStatus = data.status !== undefined ? data.status : existing.status;

  // PDF 11.2 / 11.3 / 11.6 — status transitions must keep timer fields in sync
  if (data.status !== undefined && data.status !== existing.status) {
    if (data.status === "paused" && existing.status === "in_progress") {
      const paused = pauseTask(existing);
      nextStatus = paused.status;
      pausedAt = paused.paused_at;
    } else if (data.status === "on_hold" && !["completed", "cancelled"].includes(existing.status)) {
      const held = holdTask(existing);
      nextStatus = held.status;
      pausedAt = held.paused_at;
    } else if (
      data.status === "in_progress" &&
      FROZEN_STATUSES.has(existing.status)
    ) {
      const resumed = resumeTask(existing);
      nextStatus = resumed.status;
      pausedAt = resumed.paused_at;
      if (resumed.total_paused_hours !== undefined) {
        totalPausedHours = resumed.total_paused_hours;
      }
      if (resumed.deadline !== undefined && data.deadline === undefined) {
        deadline = resumed.deadline;
      }
    } else if (data.status === "completed") {
      const completion = completeTask(existing, {
        actual_hours:
          data.actual_hours !== undefined ? data.actual_hours : undefined,
        confirm: true,
      });
      nextStatus = completion.status;
      actualHours = completion.actual_hours;
      completedAt = completion.completed_at;
      pausedAt = null;
      if (completion.total_paused_hours !== undefined) {
        totalPausedHours = completion.total_paused_hours;
      }
      if (completion.deadline !== undefined && data.deadline === undefined) {
        deadline = completion.deadline;
      }
    } else if (data.status === "cancelled") {
      actualHours = data.actual_hours !== undefined ? data.actual_hours : null;
      completedAt = null;
      pausedAt = null;
    } else if (!FROZEN_STATUSES.has(data.status)) {
      // Leaving freeze without going through resume path
      if (FROZEN_STATUSES.has(existing.status) && existing.paused_at) {
        const resumed = resumeTask(existing);
        totalPausedHours = resumed.total_paused_hours;
        if (data.deadline === undefined) {
          deadline = resumed.deadline;
        }
      }
      pausedAt = null;
    }
  }

  const becomingCompleted =
    nextStatus === "completed" && existing.status !== "completed";
  const leavingCompleted =
    existing.status === "completed" && nextStatus !== "completed";

  if (becomingCompleted && data.status === undefined) {
    if (data.actual_hours === undefined || data.actual_hours === null) {
      actualHours = calculateElapsedHours(
        { ...existing, start_time: startTime },
        new Date()
      );
    }
    completedAt = new Date();
    pausedAt = null;
  } else if (nextStatus === "cancelled" && data.status === undefined) {
    actualHours = data.actual_hours !== undefined ? data.actual_hours : null;
    completedAt = null;
  } else if (leavingCompleted) {
    completedAt = null;
  }

  if (data.paused_at !== undefined) {
    pausedAt = data.paused_at;
  }
  if (data.total_paused_hours !== undefined) {
    totalPausedHours = data.total_paused_hours;
  }

  const result = await pool.query(
    `UPDATE tasks SET
      project_id = COALESCE($2, project_id),
      assigned_to = $3,
      name = COALESCE($4, name),
      details = $5,
      complexity = COALESCE($6, complexity),
      priority = COALESCE($7, priority),
      start_time = COALESCE($8, start_time),
      estimated_hours = COALESCE($9, estimated_hours),
      deadline = COALESCE($10, deadline),
      actual_hours = $11,
      status = COALESCE($12, status),
      completed_at = $13,
      paused_at = $14,
      total_paused_hours = $15,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id`,
    [
      id,
      data.project_id,
      assignedTo,
      data.name,
      details,
      data.complexity,
      data.priority,
      data.start_time,
      estimatedHours,
      deadline,
      actualHours !== undefined ? actualHours : existing.actual_hours,
      nextStatus,
      completedAt,
      pausedAt,
      totalPausedHours,
    ]
  );

  return result.rows[0] ? findById(result.rows[0].id) : null;
};

const remove = async (id) => {
  const result = await pool.query(
    "DELETE FROM tasks WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

const applyTimerUpdate = async (id, fields) => {
  const sets = [];
  const values = [id];
  let index = 2;

  const allowed = [
    "status",
    "paused_at",
    "total_paused_hours",
    "deadline",
    "actual_hours",
    "completed_at",
  ];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${index}`);
      values.push(fields[key]);
      index += 1;
    }
  });

  if (sets.length === 0) return findById(id);

  sets.push("updated_at = NOW()");

  await pool.query(
    `UPDATE tasks SET ${sets.join(", ")} WHERE id = $1`,
    values
  );

  return findById(id);
};

const pause = async (id) => {
  const task = await findById(id);
  if (!task) return null;
  const updates = pauseTask(task);
  return applyTimerUpdate(id, updates);
};

const resume = async (id) => {
  const task = await findById(id);
  if (!task) return null;
  const updates = resumeTask(task);
  return applyTimerUpdate(id, updates);
};

const hold = async (id) => {
  const task = await findById(id);
  if (!task) return null;
  const updates = holdTask(task);
  return applyTimerUpdate(id, updates);
};

const complete = async (id, options = {}) => {
  const task = await findById(id);
  if (!task) return null;

  const result = completeTask(task, options);

  if (result.requiresConfirmation) {
    return { requiresConfirmation: true, ...result, task };
  }

  const updated = await applyTimerUpdate(id, result);
  return { requiresConfirmation: false, data: updated };
};

const bulkUpdate = async (taskIds, action, value) => {
  const results = [];

  for (const taskId of taskIds) {
    const task = await findById(taskId);
    if (!task) {
      results.push({ id: taskId, success: false, message: "Task not found" });
      continue;
    }

    try {
      let updated;

      switch (action) {
        case "assign":
          updated = await update(taskId, { assigned_to: value || null });
          break;
        case "change_status": {
          if (value === "completed") {
            const completion = await complete(taskId, { confirm: false });
            if (completion.requiresConfirmation) {
              results.push({
                id: taskId,
                success: false,
                requiresConfirmation: true,
                message: completion.message,
              });
              continue;
            }
            updated = completion.data;
          } else if (value === "paused") {
            updated = await pause(taskId);
          } else if (value === "on_hold") {
            updated = await hold(taskId);
          } else if (
            value === "in_progress" &&
            FROZEN_STATUSES.has(task.status)
          ) {
            updated = await resume(taskId);
          } else {
            updated = await update(taskId, { status: value });
          }
          break;
        }
        case "move_project":
          updated = await update(taskId, { project_id: value });
          break;
        case "on_hold":
          updated = await hold(taskId);
          break;
        case "complete": {
          const completion = await complete(taskId, { confirm: value === true });
          if (completion.requiresConfirmation) {
            results.push({
              id: taskId,
              success: false,
              requiresConfirmation: true,
              message: completion.message,
            });
            continue;
          }
          updated = completion.data;
          break;
        }
        default:
          results.push({ id: taskId, success: false, message: "Invalid action" });
          continue;
      }

      results.push({ id: taskId, success: true, data: updated });
    } catch (error) {
      results.push({ id: taskId, success: false, message: error.message });
    }
  }

  return results;
};

module.exports = {
  findAll,
  findById,
  findByProjectId,
  create,
  update,
  remove,
  pause,
  resume,
  hold,
  complete,
  bulkUpdate,
};
