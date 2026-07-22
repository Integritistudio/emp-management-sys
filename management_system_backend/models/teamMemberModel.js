const pool = require("../db");
const { parseSort } = require("../utils/queryBuilder");
const {
  efficiencyRate,
  taskVariance,
  teamQualityLabel,
} = require("../services/calculationService");

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
    has_login: Boolean(row.password_hash),
    output_level: row.output_level,
    quality_level: row.quality_level,
    total_tasks_assigned: row.total_tasks || 0,
    total_time_logged: completedActual,
    efficiency_rate: efficiencyRate(completedEstimated, completedActual),
    matrix_rating: teamQualityLabel(row.output_level, row.quality_level),
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

const findAuthByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, email, full_name, password_hash
     FROM team_members
     WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  return result.rows[0] || null;
};

const findAuthById = async (id) => {
  const result = await pool.query(
    `SELECT id, email, full_name, password_hash
     FROM team_members
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const create = async ({ title, full_name, email, password_hash = null }) => {
  const result = await pool.query(
    `INSERT INTO team_members (title, full_name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, full_name, email.toLowerCase().trim(), password_hash]
  );
  return findById(result.rows[0].id);
};

const update = async (id, { title, full_name, email, password_hash }) => {
  const result = await pool.query(
    `UPDATE team_members
     SET title = COALESCE($2, title),
         full_name = COALESCE($3, full_name),
         email = COALESCE($4, email),
         password_hash = COALESCE($5, password_hash),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      title,
      full_name,
      email ? email.toLowerCase().trim() : null,
      password_hash || null,
    ]
  );
  return result.rows[0] ? findById(result.rows[0].id) : null;
};

const updatePassword = async (id, passwordHash) => {
  const result = await pool.query(
    `UPDATE team_members
     SET password_hash = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, passwordHash]
  );
  return result.rows[0] || null;
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

const mapMemberTask = (row) => ({
  id: row.id,
  name: row.name,
  details: row.details,
  project_id: row.project_id,
  project_name: row.project_name,
  complexity: row.complexity,
  priority: row.priority,
  start_time: row.start_time,
  deadline: row.deadline,
  completed_at: row.completed_at,
  estimated_hours: Number(row.estimated_hours),
  actual_hours: row.actual_hours !== null ? Number(row.actual_hours) : null,
  variance:
    row.actual_hours !== null
      ? taskVariance(row.actual_hours, row.estimated_hours)
      : null,
  status: row.status,
});

const mapMemberProject = (row) => {
  const isLead = Boolean(row.is_lead);
  const memberTasks = row.member_tasks || 0;

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    quality: row.quality,
    start_date: row.start_date,
    is_lead: isLead,
    member_tasks: memberTasks,
    role: isLead && memberTasks > 0 ? "lead_and_contributor" : isLead ? "lead" : "contributor",
  };
};

const findDetailById = async (id) => {
  const member = await findById(id);
  if (!member) return null;

  const [tasksResult, projectsResult] = await Promise.all([
    pool.query(
      `SELECT t.*, p.name AS project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = $1::uuid
       ORDER BY t.created_at DESC`,
      [id]
    ),
    pool.query(
      `SELECT p.id, p.name, p.status, p.quality, p.start_date,
        (p.lead_developer_id = $1::uuid) AS is_lead,
        COUNT(t.id) FILTER (WHERE t.assigned_to = $1::uuid)::int AS member_tasks
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id AND t.assigned_to = $1::uuid
       WHERE p.lead_developer_id = $1::uuid
          OR EXISTS (
            SELECT 1 FROM tasks tx
            WHERE tx.project_id = p.id AND tx.assigned_to = $1::uuid
          )
       GROUP BY p.id, p.name, p.status, p.quality, p.start_date, p.lead_developer_id
       ORDER BY p.name ASC`,
      [id]
    ),
  ]);

  return {
    ...member,
    tasks: tasksResult.rows.map(mapMemberTask),
    projects: projectsResult.rows.map(mapMemberProject),
  };
};

module.exports = {
  findAll,
  findDistinctTitles,
  findById,
  findDetailById,
  findAuthByEmail,
  findAuthById,
  create,
  update,
  updatePassword,
  updateMatrixRating,
  remove,
};
