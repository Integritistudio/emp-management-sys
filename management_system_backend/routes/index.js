const express = require("express");
const authRoutes = require("./authRoutes");
const teamMemberRoutes = require("./teamMemberRoutes");
const projectManagerRoutes = require("./projectManagerRoutes");
const projectRoutes = require("./projectRoutes");
const taskRoutes = require("./taskRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const reportRoutes = require("./reportRoutes");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 message: { type: string }
 */

router.use("/auth", authRoutes);
router.use("/project-managers", authMiddleware, projectManagerRoutes);
router.use("/team-members", authMiddleware, teamMemberRoutes);
router.use("/projects", authMiddleware, projectRoutes);
router.use("/tasks", authMiddleware, taskRoutes);
router.use("/dashboard", authMiddleware, dashboardRoutes);
router.use("/reports", authMiddleware, reportRoutes);

module.exports = router;
