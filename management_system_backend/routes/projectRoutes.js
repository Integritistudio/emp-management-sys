const express = require("express");
const { body, param } = require("express-validator");
const projectController = require("../controllers/projectController");
const validate = require("../middleware/validateMiddleware");

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
 * /projects:
 *   get:
 *     summary: List projects
 *     tags: [Projects]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: quality
 *         schema: { type: string }
 *       - in: query
 *         name: leadDeveloperId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Projects list
 *   post:
 *     summary: Create project
 *     tags: [Projects]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       201:
 *         description: Project created
 */
router.get("/", projectController.getAll);
router.get("/:id", param("id").isUUID(), validate, projectController.getById);
router.post("/", projectValidation, validate, projectController.create);
/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get project with tasks
 *     tags: [Projects]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project detail with task sub-table
 *   put:
 *     summary: Update project
 *     tags: [Projects]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project updated
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project deleted
 */
router.put(  "/:id",
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
router.delete("/:id", param("id").isUUID(), validate, projectController.remove);

module.exports = router;
