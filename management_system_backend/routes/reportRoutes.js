const express = require("express");
const { param, body } = require("express-validator");
const reportController = require("../controllers/reportController");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

const reportQueryDocs = `
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
 *       - in: query
 *         name: developerId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: projectId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string }
`;

/**
 * @swagger
 * /reports/team:
 *   get:
 *     summary: Team reports overview with chart data
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }]
 */
router.get("/team", reportController.getTeamReports);

/**
 * @swagger
 * /reports/me:
 *   get:
 *     summary: Current member's own report
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }]
 */
router.get("/me", reportController.getMyReport);

/**
 * @swagger
 * /reports/team/{id}:
 *   get:
 *     summary: Single team member report
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }]
 */
router.get(
  "/team/:id",
  param("id").isUUID(),
  validate,
  reportController.getTeamReportById
);

/**
 * @swagger
 * /reports/project:
 *   get:
 *     summary: Project reports overview with chart data
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }]
 */
router.get("/project", reportController.getProjectReports);

/**
 * @swagger
 * /reports/project/{id}:
 *   get:
 *     summary: Single project report
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }]
 */
router.get(
  "/project/:id",
  param("id").isUUID(),
  validate,
  reportController.getProjectReportById
);

/**
 * @swagger
 * /reports/export/team-pdf:
 *   post:
 *     summary: Export team report as branded PDF
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }]
 */
router.post(
  "/export/team-pdf",
  body("period").optional().isIn(["week", "month", "custom"]),
  body("startDate").optional().isISO8601(),
  body("endDate").optional().isISO8601(),
  body("developerId").optional().isUUID(),
  body("teamMemberId").optional().isUUID(),
  body("status").optional().isString(),
  validate,
  reportController.exportTeamPdf
);

/**
 * @swagger
 * /reports/export/project-pdf:
 *   post:
 *     summary: Export project report as branded PDF
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }]
 */
router.post(
  "/export/project-pdf",
  body("period").optional().isIn(["week", "month", "custom"]),
  body("startDate").optional().isISO8601(),
  body("endDate").optional().isISO8601(),
  body("projectId").optional().isUUID(),
  body("status").optional().isString(),
  validate,
  reportController.exportProjectPdf
);

module.exports = router;
