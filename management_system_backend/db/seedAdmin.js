const bcrypt = require("bcryptjs");
const adminModel = require("../models/adminModel");

/**
 * First-deploy bootstrap from ADMIN_EMAIL + ADMIN_PASSWORD.
 * - Requires both env values to create an admin
 * - If that email already exists → skip (never overwrite password)
 * - Password matching is done at login (bcrypt), not on startup
 */
async function seedAdminIfNeeded() {
  const email = (process.env.ADMIN_EMAIL || "").trim();
  const password = process.env.ADMIN_PASSWORD || "";

  if (!email || !password) {
    const count = await adminModel.countAdmins();
    if (count === 0) {
      console.warn(
        "[STARTUP] No admin in DB — set both ADMIN_EMAIL and ADMIN_PASSWORD in .env to create the first admin"
      );
    }
    return;
  }

  const existing = await adminModel.findByEmail(email);
  if (existing) {
    console.log(`[STARTUP] Admin already exists for ${email} — skipping seed`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await adminModel.createAdmin(email, passwordHash);
  console.log(`[STARTUP] Admin created from env: ${admin.email}`);
}

module.exports = seedAdminIfNeeded;
