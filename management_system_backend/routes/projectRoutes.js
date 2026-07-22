const express = require("express");
const { body, param } = require("express-validator");
const projectController = require("../controllers/projectController");
const validate = require("../middleware/validateMiddleware");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

const projectValidation = [
  body("name").trim().notEmpty().withMessage("Project name is required"),
  body("start_date").isISO8601().withMessage("Valid start date is required"),
  body("quality").optional().isIn(["low", "medium", "high"]),
  body("status")
    .optional()
    .isIn(["not_started", "active", "on_hold", "completed", "delayed", "cancelled"]),
  body("lead_developer_id").optional({ nullable: true }).isUUID(),
];

/**
 * @swagger
 * /projects/options:
 *   get:
 *     summary: Minimal project list (id, name) for task forms
 *     tags: [Projects]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Project options
 */
router.get("/options", projectController.getOptions);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: List projects (admin only)
 *     tags: [Projects]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Projects list
 *   post:
 *     summary: Create project (admin only)
 *     tags: [Projects]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       201:
 *         description: Project created
 */
router.get("/", requireAdmin, projectController.getAll);
router.get("/:id", requireAdmin, param("id").isUUID(), validate, projectController.getById);
router.post("/", requireAdmin, projectValidation, validate, projectController.create);
router.put(
  "/:id",
  requireAdmin,
  param("id").isUUID(),
  body("name").optional().trim().notEmpty(),
  body("start_date").optional().isISO8601(),
  body("quality").optional().isIn(["low", "medium", "high"]),
  body("status")
    .optional()
    .isIn(["not_started", "active", "on_hold", "completed", "delayed", "cancelled"]),
  body("lead_developer_id").optional({ nullable: true }).isUUID(),
  validate,
  projectController.update
);
router.delete(
  "/:id",
  requireAdmin,
  param("id").isUUID(),
  validate,
  projectController.remove
);

module.exports = router;
