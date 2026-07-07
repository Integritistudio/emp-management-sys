const pool = require("../db");
const { parseSort } = require("../utils/queryBuilder");
const { efficiencyRate } = require("../services/calculationService");

const TEAM_STATS_JOIN = `
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::int AS total_tasks,
      COALESCE(SUM(estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_estimated,
      COALESCE(SUM(actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_actual
    FROM tasks t
    WHERE t.assigned_to = tm.id
  ) task_stats ON true
`;

const EFFICIENCY_SQL = `ROUND((
  CASE
    WHEN COALESCE(task_stats.completed_actual, 0) = 0 THEN
      CASE WHEN COALESCE(task_stats.completed_estimated, 0) > 0 THEN 0 ELSE 100 END
    ELSE (COALESCE(task_stats.completed_estimated, 0) / NULLIF(task_stats.completed_actual, 0)) * 100
  END
)::numeric, 2)`;

const EFFICIENCY_RANGES = {
  gt_100: `(${EFFICIENCY_SQL}) > 100`,
  lt_60: `(${EFFICIENCY_SQL}) < 60`,
  "60_80": `(${EFFICIENCY_SQL}) >= 60 AND (${EFFICIENCY_SQL}) < 80`,
  "80_90": `(${EFFICIENCY_SQL}) >= 80 AND (${EFFICIENCY_SQL}) < 90`,
  "90_100": `(${EFFICIENCY_SQL}) >= 90 AND (${EFFICIENCY_SQL}) <= 100`,
};

const mapTeamMember = (row) => {
  const completedEstimated = Number(row.completed_estimated || 0);
  const completedActual = Number(row.completed_actual || 0);

  return {
    id: row.id,
    title: row.title,
    full_name: row.full_name,
    email: row.email,
    output_level: row.output_level,
    quality_level: row.quality_level,
    total_tasks_assigned: row.total_tasks || 0,
    total_time_logged: completedActual,
    efficiency_rate: efficiencyRate(completedEstimated, completedActual),
    matrix_rating: `${row.output_level} output / ${row.quality_level} quality`,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const findAll = async (query = {}) => {
  const conditions = [];
  const values = [];
  let index = 1;

  if (query.search) {
    conditions.push(
      `(tm.full_name ILIKE $${index} OR tm.email ILIKE $${index} OR tm.title ILIKE $${index})`
    );
    values.push(`%${query.search}%`);
    index += 1;
  }

  if (query.title) {
    conditions.push(`tm.title = $${index}`);
    values.push(query.title);
    index += 1;
  }

  if (query.efficiencyRange && EFFICIENCY_RANGES[query.efficiencyRange]) {
    conditions.push(EFFICIENCY_RANGES[query.efficiencyRange]);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sort = parseSort(
    query.sort,
    {
      name: "tm.full_name",
      email: "tm.email",
      title: "tm.title",
      created_at: "tm.created_at",
    },
    "tm.full_name ASC"
  );

  const result = await pool.query(
    `SELECT tm.*,
      task_stats.total_tasks,
      task_stats.completed_estimated,
      task_stats.completed_actual
    FROM team_members tm
    ${TEAM_STATS_JOIN}
    ${whereClause}
    ORDER BY ${sort}`,
    values
  );

  return result.rows.map(mapTeamMember);
};

const findDistinctTitles = async () => {
  const result = await pool.query(
    `SELECT DISTINCT title FROM team_members ORDER BY title ASC`
  );
  return result.rows.map((row) => row.title);
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT tm.*,
      task_stats.total_tasks,
      task_stats.completed_estimated,
      task_stats.completed_actual
    FROM team_members tm
    ${TEAM_STATS_JOIN}
    WHERE tm.id = $1`,
    [id]
  );
  return result.rows[0] ? mapTeamMember(result.rows[0]) : null;
};

const create = async ({ title, full_name, email }) => {
  const result = await pool.query(
    `INSERT INTO team_members (title, full_name, email)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [title, full_name, email.toLowerCase().trim()]
  );
  return findById(result.rows[0].id);
};

const update = async (id, { title, full_name, email }) => {
  const result = await pool.query(
    `UPDATE team_members
     SET title = COALESCE($2, title),
         full_name = COALESCE($3, full_name),
         email = COALESCE($4, email),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, title, full_name, email ? email.toLowerCase().trim() : null]
  );
  return result.rows[0] ? findById(result.rows[0].id) : null;
};

const updateMatrixRating = async (id, { output_level, quality_level }) => {
  const result = await pool.query(
    `UPDATE team_members
     SET output_level = COALESCE($2, output_level),
         quality_level = COALESCE($3, quality_level),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, output_level, quality_level]
  );
  return result.rows[0] ? findById(result.rows[0].id) : null;
};

const remove = async (id) => {
  const result = await pool.query(
    "DELETE FROM team_members WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  findAll,
  findDistinctTitles,
  findById,
  create,
  update,
  updateMatrixRating,
  remove,
};
