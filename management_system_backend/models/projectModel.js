const pool = require("../db");
const { parseSort } = require("../utils/queryBuilder");
const {
  efficiencyRate,
  projectVariance,
} = require("../services/calculationService");

const PROJECT_AGG_JOIN = `
  LEFT JOIN team_members ld ON p.lead_developer_id = ld.id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::int AS total_tasks,
      COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed_tasks,
      COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS active_tasks,
      COUNT(*) FILTER (WHERE t.status = 'on_hold')::int AS on_hold_tasks,
      COALESCE(SUM(t.estimated_hours), 0) AS total_estimated,
      COALESCE(SUM(t.actual_hours), 0) AS total_actual,
      COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_estimated,
      COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_actual
    FROM tasks t
    WHERE t.project_id = p.id
  ) task_agg ON true
`;

const mapProject = (row) => {
  const totalEstimated = Number(row.total_estimated || 0);
  const totalActual = Number(row.total_actual || 0);
  // Variance & efficiency compare like-for-like: estimated vs actual of the
  // SAME completed tasks (PDF 8.8, 8.9, 21.2, 21.4). Using all-task estimated
  // against completed-only actual would understate efficiency.
  const completedEstimated = Number(row.completed_estimated || 0);
  const completedActual = Number(row.completed_actual || 0);

  return {
    id: row.id,
    name: row.name,
    lead_developer_id: row.lead_developer_id,
    lead_developer_name: row.lead_developer_name,
    start_date: row.start_date,
    quality: row.quality,
    status: row.status,
    total_tasks: row.total_tasks || 0,
    completed_tasks: row.completed_tasks || 0,
    active_tasks: row.active_tasks || 0,
    on_hold_tasks: row.on_hold_tasks || 0,
    total_estimated_time: totalEstimated,
    total_actual_time: totalActual,
    total_project_time: completedActual,
    project_variance: projectVariance(completedActual, completedEstimated),
    project_efficiency_rate: efficiencyRate(completedEstimated, completedActual),
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
      task_agg.total_tasks, task_agg.completed_tasks, task_agg.active_tasks,
      task_agg.on_hold_tasks, task_agg.total_estimated, task_agg.total_actual,
      task_agg.completed_actual
    FROM projects p
    ${PROJECT_AGG_JOIN}
    ${whereClause}
    ORDER BY ${sort}`,
    values
  );

  return result.rows.map(mapProject);
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT p.*, ld.full_name AS lead_developer_name,
      task_agg.total_tasks, task_agg.completed_tasks, task_agg.active_tasks,
      task_agg.on_hold_tasks, task_agg.total_estimated, task_agg.total_actual,
      task_agg.completed_actual
    FROM projects p
    ${PROJECT_AGG_JOIN}
    WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] ? mapProject(result.rows[0]) : null;
};

const create = async ({ name, lead_developer_id, start_date, quality, status }) => {
  const result = await pool.query(
    `INSERT INTO projects (name, lead_developer_id, start_date, quality, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [name, lead_developer_id || null, start_date, quality || "medium", status || "not_started"]
  );
  return findById(result.rows[0].id);
};

const update = async (id, data) => {
  const result = await pool.query(
    `UPDATE projects
     SET name = COALESCE($2, name),
         lead_developer_id = COALESCE($3, lead_developer_id),
         start_date = COALESCE($4, start_date),
         quality = COALESCE($5, quality),
         status = COALESCE($6, status),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, data.name, data.lead_developer_id, data.start_date, data.quality, data.status]
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

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
