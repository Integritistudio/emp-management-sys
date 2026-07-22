const pool = require("../db");

const findByEmail = async (email) => {
  const result = await pool.query(
    "SELECT id, email, password_hash, created_at FROM admins WHERE email = $1",
    [email.toLowerCase().trim()]
  );
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await pool.query(
    "SELECT id, email, created_at FROM admins WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

const countAdmins = async () => {
  const result = await pool.query("SELECT COUNT(*)::int AS count FROM admins");
  return result.rows[0].count;
};

const createAdmin = async (email, passwordHash) => {
  const result = await pool.query(
    `INSERT INTO admins (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, created_at`,
    [email.toLowerCase().trim(), passwordHash]
  );
  return result.rows[0];
};

const updatePassword = async (id, passwordHash) => {
  const result = await pool.query(
    `UPDATE admins SET password_hash = $2 WHERE id = $1
     RETURNING id, email, created_at`,
    [id, passwordHash]
  );
  return result.rows[0] || null;
};

module.exports = {
  findByEmail,
  findById,
  countAdmins,
  createAdmin,
  updatePassword,
};
