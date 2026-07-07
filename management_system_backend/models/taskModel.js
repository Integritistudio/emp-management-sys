const pool = require("../db");
const { parseSort } = require("../utils/queryBuilder");
const {
  taskVariance,
  addHoursToDate,
} = require("../services/calculationService");

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

  // Deadline (PDF 10.11 / 11.4): use a manually supplied end time when given;
  // otherwise only recompute (start + estimated) when start time or estimated
  // hours actually changed. Unrelated edits must NOT recompute, or they would
  // erase the deadline extension added by pause/resume (PDF 11.2, 11.3).
  const startChanged =
    data.start_time !== undefined &&
    new Date(data.start_time).getTime() !==
      new Date(existing.start_time).getTime();
  const estimatedChanged =
    data.estimated_hours !== undefined &&
    Number(data.estimated_hours) !== Number(existing.estimated_hours);

  let deadline;
  if (data.deadline !== undefined) {
    deadline = data.deadline;
  } else if (startChanged || estimatedChanged) {
    deadline = addHoursToDate(startTime, estimatedHours);
  } else {
    deadline = existing.deadline;
  }

  // Derive completion-related fields so that marking a task "completed" through
  // the edit form / bulk change_status behaves the same as the dedicated
  // complete flow (PDF 12.1): actual time is auto-calculated from the timer
  // unless the admin manually supplied it. See below for per-status handling.
  const { calculateElapsedHours } = require("../services/taskTimerService");

  let actualHours = data.actual_hours;
  let completedAt = existing.completed_at;

  const nextStatus = data.status !== undefined ? data.status : existing.status;
  const becomingCompleted =
    nextStatus === "completed" && existing.status !== "completed";
  const leavingCompleted =
    existing.status === "completed" && nextStatus !== "completed";

  if (becomingCompleted) {
    // Auto-fill actual hours from real elapsed time when not manually provided.
    if (data.actual_hours === undefined || data.actual_hours === null) {
      actualHours = calculateElapsedHours(
        { ...existing, start_time: startTime },
        new Date()
      );
    }
    completedAt = new Date();
  } else if (nextStatus === "cancelled") {
    // Cancelled tasks are excluded from logged hours / efficiency (PDF 9.5, 21.5).
    actualHours = data.actual_hours !== undefined ? data.actual_hours : null;
    completedAt = null;
  } else if (leavingCompleted) {
    // Reopening a completed task clears its completion timestamp.
    completedAt = null;
  }

  const result = await pool.query(
    `UPDATE tasks SET
      project_id = COALESCE($2, project_id),
      assigned_to = COALESCE($3, assigned_to),
      name = COALESCE($4, name),
      details = COALESCE($5, details),
      complexity = COALESCE($6, complexity),
      priority = COALESCE($7, priority),
      start_time = COALESCE($8, start_time),
      estimated_hours = COALESCE($9, estimated_hours),
      deadline = COALESCE($10, deadline),
      actual_hours = $11,
      status = COALESCE($12, status),
      completed_at = $13,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id`,
    [
      id,
      data.project_id,
      data.assigned_to,
      data.name,
      data.details,
      data.complexity,
      data.priority,
      data.start_time,
      estimatedHours,
      deadline,
      actualHours !== undefined ? actualHours : existing.actual_hours,
      data.status,
      completedAt,
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

  const { pauseTask } = require("../services/taskTimerService");
  const updates = pauseTask(task);
  return applyTimerUpdate(id, updates);
};

const resume = async (id) => {
  const task = await findById(id);
  if (!task) return null;

  const { resumeTask } = require("../services/taskTimerService");
  const updates = resumeTask(task);
  return applyTimerUpdate(id, updates);
};

const complete = async (id, options = {}) => {
  const task = await findById(id);
  if (!task) return null;

  const { completeTask } = require("../services/taskTimerService");
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
        case "change_status":
          updated = await update(taskId, { status: value });
          break;
        case "move_project":
          updated = await update(taskId, { project_id: value });
          break;
        case "on_hold":
          updated = await update(taskId, { status: "on_hold", paused_at: null });
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
  complete,
  bulkUpdate,
};
