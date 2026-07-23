const jwt = require("jsonwebtoken");
const adminModel = require("../models/adminModel");
const teamMemberModel = require("../models/teamMemberModel");
const projectManagerModel = require("../models/projectManagerModel");
const pool = require("../db");

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
      req.admin = null;
      return next();
    }

    if (role === "project_admin") {
      const manager = await projectManagerModel.findAuthById(decoded.id);
      if (!manager || !manager.password_hash) {
        return res.status(401).json({ message: "Invalid session" });
      }

      req.user = {
        id: manager.id,
        email: manager.email,
        role: "project_admin",
        managerId: manager.id,
        full_name: manager.full_name,
      };
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

const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

const isMember = (req) => req.user?.role === "member";
const isProjectAdmin = (req) => req.user?.role === "project_admin";
const isAdmin = (req) => req.user?.role === "admin";
const memberId = (req) => req.user?.memberId || null;
const managerId = (req) => req.user?.managerId || null;

const accessibleProjectSql = (managerIdParam) =>
  `(p.owner_id = ${managerIdParam} OR EXISTS (
      SELECT 1 FROM project_collaborators pc
      WHERE pc.project_id = p.id AND pc.project_manager_id = ${managerIdParam}
    ))`;

const canAccessProject = async (user, projectId) => {
  if (!user || !projectId) return false;
  if (user.role === "admin") return true;
  if (user.role !== "project_admin") return false;

  const result = await pool.query(
    `SELECT 1 FROM projects p
     WHERE p.id = $1
       AND (p.owner_id = $2 OR EXISTS (
         SELECT 1 FROM project_collaborators pc
         WHERE pc.project_id = p.id AND pc.project_manager_id = $2
       ))
     LIMIT 1`,
    [projectId, user.managerId]
  );
  return result.rows.length > 0;
};

const getAccessibleProjectIds = async (user) => {
  if (!user || user.role !== "project_admin") return null;
  const result = await pool.query(
    `SELECT p.id FROM projects p
     WHERE p.owner_id = $1 OR EXISTS (
       SELECT 1 FROM project_collaborators pc
       WHERE pc.project_id = p.id AND pc.project_manager_id = $1
     )`,
    [user.managerId]
  );
  return result.rows.map((r) => r.id);
};

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
module.exports.requireRoles = requireRoles;
module.exports.isMember = isMember;
module.exports.isProjectAdmin = isProjectAdmin;
module.exports.isAdmin = isAdmin;
module.exports.memberId = memberId;
module.exports.managerId = managerId;
module.exports.canAccessProject = canAccessProject;
module.exports.getAccessibleProjectIds = getAccessibleProjectIds;
module.exports.accessibleProjectSql = accessibleProjectSql;
