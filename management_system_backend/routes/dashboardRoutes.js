const express = require("express");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Dashboard analytics cards
 *     tags: [Dashboard]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [week, month, custom] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 */
router.get("/stats", dashboardController.getStats);

/**
 * @swagger
 * /dashboard/team-performance:
 *   get:
 *     summary: Team performance table data
 *     tags: [Dashboard]
 *     security: [{ cookieAuth: [] }]
 */
router.get("/team-performance", dashboardController.getTeamPerformance);

/**
 * @swagger
 * /dashboard/weekday-breakdown:
 *   get:
 *     summary: Mon-Fri task completion breakdown
 *     tags: [Dashboard]
 *     security: [{ cookieAuth: [] }]
 */
router.get("/weekday-breakdown", dashboardController.getWeekdayBreakdown);

/**
 * @swagger
 * /dashboard/matrix:
 *   get:
 *     summary: 3x3 team performance matrix
 *     tags: [Dashboard]
 *     security: [{ cookieAuth: [] }]
 */
router.get("/matrix", dashboardController.getMatrix);

module.exports = router;
