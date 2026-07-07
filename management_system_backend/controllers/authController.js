const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminModel = require("../models/adminModel");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for: ${email}`);

    const admin = await adminModel.findByEmail(email);

    if (!admin) {
      console.warn(`[AUTH] Login failed — email not found: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      console.warn(`[AUTH] Login failed — wrong password for: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.cookie("token", token, COOKIE_OPTIONS);
    console.log(`[AUTH] Login successful for: ${email}`);

    res.json({
      message: "Login successful",
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error(`[AUTH] Login error:`, error.message);
    next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });
  res.json({ message: "Logged out successfully" });
};

const me = (req, res) => {
  res.json({
    admin: {
      id: req.admin.id,
      email: req.admin.email,
    },
  });
};

module.exports = {
  login,
  logout,
  me,
};
