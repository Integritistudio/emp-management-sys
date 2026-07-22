const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminModel = require("../models/adminModel");
const teamMemberModel = require("../models/teamMemberModel");

const BCRYPT_ROUNDS = 12;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for: ${email}`);

    const admin = await adminModel.findByEmail(email);

    if (admin) {
      const isValid = await bcrypt.compare(password, admin.password_hash);
      if (!isValid) {
        console.warn(`[AUTH] Login failed — wrong password for admin: ${email}`);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = signToken({
        id: admin.id,
        email: admin.email,
        role: "admin",
      });

      res.cookie("token", token, COOKIE_OPTIONS);
      console.log(`[AUTH] Admin login successful for: ${email}`);

      return res.json({
        message: "Login successful",
        user: {
          id: admin.id,
          email: admin.email,
          role: "admin",
        },
        // Backward-compatible shape for existing frontend
        admin: {
          id: admin.id,
          email: admin.email,
          role: "admin",
        },
      });
    }

    const member = await teamMemberModel.findAuthByEmail(email);
    if (!member || !member.password_hash) {
      console.warn(`[AUTH] Login failed — email not found or no login: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, member.password_hash);
    if (!isValid) {
      console.warn(`[AUTH] Login failed — wrong password for member: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken({
      id: member.id,
      email: member.email,
      role: "member",
      memberId: member.id,
    });

    res.cookie("token", token, COOKIE_OPTIONS);
    console.log(`[AUTH] Member login successful for: ${email}`);

    const user = {
      id: member.id,
      email: member.email,
      role: "member",
      full_name: member.full_name,
      memberId: member.id,
    };

    return res.json({
      message: "Login successful",
      user,
      admin: user,
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
  const user = {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    ...(req.user.role === "member"
      ? { full_name: req.user.full_name, memberId: req.user.memberId }
      : {}),
  };

  res.json({
    user,
    // Backward-compatible shape
    admin: user,
  });
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    if (req.user.role === "admin") {
      const admin = await adminModel.findByEmail(req.user.email);
      if (!admin) {
        return res.status(401).json({ message: "Invalid session" });
      }

      const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await adminModel.updatePassword(admin.id, passwordHash);
    } else {
      const member = await teamMemberModel.findAuthById(req.user.id);
      if (!member || !member.password_hash) {
        return res.status(401).json({ message: "Invalid session" });
      }

      const isValid = await bcrypt.compare(currentPassword, member.password_hash);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await teamMemberModel.updatePassword(member.id, passwordHash);
    }

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  me,
  changePassword,
};
