const jwt = require("jsonwebtoken");
const adminModel = require("../models/adminModel");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await adminModel.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({ message: "Invalid session" });
    }

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};

module.exports = authMiddleware;
