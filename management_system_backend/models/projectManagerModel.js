const pool = require("../db");

const mapManager = (row) => ({
  id: row.id,
  full_name: row.full_name,
  email: row.email,
  has_login: Boolean(row.password_hash),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const findAll = async () => {
  const result = await pool.query(
    `SELECT id, full_name, email, password_hash, created_at, updated_at
     FROM project_managers
     ORDER BY full_name ASC`
  );
  return result.rows.map(mapManager);
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT id, full_name, email, password_hash, created_at, updated_at
     FROM project_managers
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] ? mapManager(result.rows[0]) : null;
};

const findAuthByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, email, full_name, password_hash
     FROM project_managers
     WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  return result.rows[0] || null;
};

const findAuthById = async (id) => {
  const result = await pool.query(
    `SELECT id, email, full_name, password_hash
     FROM project_managers
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const create = async ({ full_name, email, password_hash }) => {
  const result = await pool.query(
    `INSERT INTO project_managers (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [full_name, email.toLowerCase().trim(), password_hash]
  );
  return findById(result.rows[0].id);
};

const update = async (id, { full_name, email, password_hash }) => {
  const result = await pool.query(
    `UPDATE project_managers
     SET full_name = COALESCE($2, full_name),
         email = COALESCE($3, email),
         password_hash = COALESCE($4, password_hash),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [
      id,
      full_name || null,
      email ? email.toLowerCase().trim() : null,
      password_hash || null,
    ]
  );
  return result.rows[0] ? findById(result.rows[0].id) : null;
};

const updatePassword = async (id, passwordHash) => {
  const result = await pool.query(
    `UPDATE project_managers
     SET password_hash = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, passwordHash]
  );
  return result.rows[0] || null;
};

const remove = async (id) => {
  const result = await pool.query(
    `DELETE FROM project_managers WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
};

module.exports = {
  findAll,
  findById,
  findAuthByEmail,
  findAuthById,
  create,
  update,
  updatePassword,
  remove,
};
