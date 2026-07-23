const pool = require("../db");
const { parseSort } = require("../utils/queryBuilder");
const {
  efficiencyRate,
  projectVariance,
  totalProjectTime,
} = require("../services/calculationService");
const { calculateElapsedHours } = require("../services/taskTimerService");

const PROJECT_AGG_JOIN = `
  LEFT JOIN team_members ld ON p.lead_developer_id = ld.id
  LEFT JOIN project_managers om ON p.owner_id = om.id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::int AS total_tasks,
      COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed_tasks,
      COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS active_tasks,
      COUNT(*) FILTER (WHERE t.status = 'on_hold')::int AS on_hold_tasks,
      COALESCE(SUM(t.estimated_hours), 0) AS total_estimated,
      COALESCE(SUM(t.actual_hours), 0) AS total_actual,
      COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_estimated,
      COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_actual,
      COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status IN ('in_progress', 'paused')), 0) AS active_actual
    FROM tasks t
    WHERE t.project_id = p.id
  ) task_agg ON true
`;

const mapProject = (row) => {
  const totalEstimated = Number(row.total_estimated || 0);
  const totalActual = Number(row.total_actual || 0);
  const completedActual = Number(row.completed_actual || 0);
  const activeActual = Number(row.active_actual || 0);

  return {
    id: row.id,
    name: row.name,
    lead_developer_id: row.lead_developer_id,
    lead_developer_name: row.lead_developer_name,
    owner_id: row.owner_id || null,
    owner_name: row.owner_name || null,
    start_date: row.start_date,
    quality: row.quality,
    status: row.status,
    locked_hours:
      row.locked_hours !== null && row.locked_hours !== undefined
        ? Number(row.locked_hours)
        : null,
    total_tasks: row.total_tasks || 0,
    completed_tasks: row.completed_tasks || 0,
    active_tasks: row.active_tasks || 0,
    on_hold_tasks: row.on_hold_tasks || 0,
    total_estimated_time: totalEstimated,
    total_actual_time: totalActual,
    total_project_time: totalProjectTime(completedActual),
    active_task_time: activeActual,
    project_variance: projectVariance(totalActual, totalEstimated),
    project_efficiency_rate: efficiencyRate(totalEstimated, totalActual),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const buildProjectWhere = (query) => {
  const conditions = [];
  const values = [];
  let index = 1;

  if (query.search) {
    conditions.push(`p.name ILIKE $${index}`);
    values.push(`%${query.search}%`);
    index += 1;
  }
  if (query.status) {
    conditions.push(`p.status = $${index}`);
    values.push(query.status);
    index += 1;
  }
  if (query.quality) {
    conditions.push(`p.quality = $${index}`);
    values.push(query.quality);
    index += 1;
  }
  if (query.leadDeveloperId) {
    conditions.push(`p.lead_developer_id = $${index}`);
    values.push(query.leadDeveloperId);
    index += 1;
  }
  if (query.startDate) {
    conditions.push(`p.start_date >= $${index}`);
    values.push(query.startDate);
    index += 1;
  }
  if (query.endDate) {
    conditions.push(`p.start_date <= $${index}`);
    values.push(query.endDate);
    index += 1;
  }
  if (query.managerId) {
    conditions.push(
      `(p.owner_id = $${index} OR EXISTS (
        SELECT 1 FROM project_collaborators pc
        WHERE pc.project_id = p.id AND pc.project_manager_id = $${index}
      ))`
    );
    values.push(query.managerId);
    index += 1;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, values };
};

const findAll = async (query = {}) => {
  const { whereClause, values } = buildProjectWhere(query);
  const sort = parseSort(
    query.sort,
    {
      name: "p.name",
      start_date: "p.start_date",
      status: "p.status",
      quality: "p.quality",
      created_at: "p.created_at",
    },
    "p.created_at DESC"
  );

  const result = await pool.query(
    `SELECT p.*, ld.full_name AS lead_developer_name,
      om.full_name AS owner_name,
      task_agg.total_tasks, task_agg.completed_tasks, task_agg.active_tasks,
      task_agg.on_hold_tasks, task_agg.total_estimated, task_agg.total_actual,
      task_agg.completed_actual, task_agg.active_actual
    FROM projects p
    ${PROJECT_AGG_JOIN}
    ${whereClause}
    ORDER BY ${sort}`,
    values
  );

  return result.rows.map(mapProject);
};

const sumActiveTaskElapsedHours = async (projectId) => {
  const result = await pool.query(
    `SELECT start_time, total_paused_hours, paused_at, actual_hours
     FROM tasks
     WHERE project_id = $1 AND status IN ('in_progress', 'paused')`,
    [projectId]
  );

  const total = result.rows.reduce((sum, task) => {
    const hours =
      task.actual_hours != null
        ? Number(task.actual_hours)
        : calculateElapsedHours(task);
    return sum + hours;
  }, 0);

  return Number(total.toFixed(2));
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT p.*, ld.full_name AS lead_developer_name,
      om.full_name AS owner_name,
      task_agg.total_tasks, task_agg.completed_tasks, task_agg.active_tasks,
      task_agg.on_hold_tasks, task_agg.total_estimated, task_agg.total_actual,
      task_agg.completed_actual, task_agg.active_actual
    FROM projects p
    ${PROJECT_AGG_JOIN}
    WHERE p.id = $1`,
    [id]
  );
  if (!result.rows[0]) return null;

  const project = mapProject(result.rows[0]);
  project.active_task_time = await sumActiveTaskElapsedHours(id);
  return project;
};

const create = async ({
  name,
  lead_developer_id,
  start_date,
  quality,
  status,
  owner_id,
  locked_hours,
}) => {
  const result = await pool.query(
    `INSERT INTO projects (name, lead_developer_id, start_date, quality, status, owner_id, locked_hours)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      name,
      lead_developer_id || null,
      start_date,
      quality || "medium",
      status || "not_started",
      owner_id || null,
      locked_hours !== undefined && locked_hours !== null && locked_hours !== ""
        ? Number(locked_hours)
        : null,
    ]
  );
  return findById(result.rows[0].id);
};

const update = async (id, data) => {
  const hasLockedHours = Object.prototype.hasOwnProperty.call(
    data,
    "locked_hours"
  );
  const result = await pool.query(
    `UPDATE projects
     SET name = COALESCE($2, name),
         lead_developer_id = COALESCE($3, lead_developer_id),
         start_date = COALESCE($4, start_date),
         quality = COALESCE($5, quality),
         status = COALESCE($6, status),
         owner_id = COALESCE($7, owner_id),
         locked_hours = CASE WHEN $9::boolean THEN $8 ELSE locked_hours END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [
      id,
      data.name,
      data.lead_developer_id,
      data.start_date,
      data.quality,
      data.status,
      data.owner_id !== undefined ? data.owner_id : null,
      hasLockedHours &&
      data.locked_hours !== null &&
      data.locked_hours !== ""
        ? Number(data.locked_hours)
        : null,
      hasLockedHours,
    ]
  );
  return result.rows[0] ? findById(result.rows[0].id) : null;
};

const remove = async (id) => {
  const result = await pool.query(
    "DELETE FROM projects WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

const findOptions = async (managerId = null) => {
  if (managerId) {
    const result = await pool.query(
      `SELECT p.id, p.name FROM projects p
       WHERE p.owner_id = $1 OR EXISTS (
         SELECT 1 FROM project_collaborators pc
         WHERE pc.project_id = p.id AND pc.project_manager_id = $1
       )
       ORDER BY p.name ASC`,
      [managerId]
    );
    return result.rows;
  }
  const result = await pool.query(
    `SELECT id, name FROM projects ORDER BY name ASC`
  );
  return result.rows;
};

const listCollaborators = async (projectId) => {
  const result = await pool.query(
    `SELECT pm.id, pm.full_name, pm.email, pc.created_at AS added_at
     FROM project_collaborators pc
     INNER JOIN project_managers pm ON pm.id = pc.project_manager_id
     WHERE pc.project_id = $1
     ORDER BY pm.full_name ASC`,
    [projectId]
  );
  return result.rows;
};

const addCollaborator = async (projectId, projectManagerId) => {
  await pool.query(
    `INSERT INTO project_collaborators (project_id, project_manager_id)
     VALUES ($1, $2)
     ON CONFLICT (project_id, project_manager_id) DO NOTHING`,
    [projectId, projectManagerId]
  );
  return listCollaborators(projectId);
};

const removeCollaborator = async (projectId, projectManagerId) => {
  const result = await pool.query(
    `DELETE FROM project_collaborators
     WHERE project_id = $1 AND project_manager_id = $2
     RETURNING id`,
    [projectId, projectManagerId]
  );
  return result.rows[0] || null;
};

module.exports = {
  findAll,
  findById,
  findOptions,
  create,
  update,
  remove,
  listCollaborators,
  addCollaborator,
  removeCollaborator,
};
