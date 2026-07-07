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

module.exports = {
  findByEmail,
  findById,
};
