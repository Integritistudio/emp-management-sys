const jwt = require("jsonwebtoken");
const adminModel = require("../models/adminModel");
const teamMemberModel = require("../models/teamMemberModel");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role || "admin";

    if (role === "member") {
      const member = await teamMemberModel.findAuthById(decoded.id);
      if (!member || !member.password_hash) {
        return res.status(401).json({ message: "Invalid session" });
      }

      req.user = {
        id: member.id,
        email: member.email,
        role: "member",
        memberId: member.id,
        full_name: member.full_name,
      };
      // Backward-compatible alias used by older auth handlers
      req.admin = null;
      return next();
    }

    const admin = await adminModel.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: "Invalid session" });
    }

    req.user = {
      id: admin.id,
      email: admin.email,
      role: "admin",
    };
    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

const isMember = (req) => req.user?.role === "member";

const memberId = (req) => req.user?.memberId || null;

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
module.exports.isMember = isMember;
module.exports.memberId = memberId;
