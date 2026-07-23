const express = require("express");
const { body, param } = require("express-validator");
const projectController = require("../controllers/projectController");
const validate = require("../middleware/validateMiddleware");
const { requireRoles } = require("../middleware/authMiddleware");

const router = express.Router();

const projectValidation = [
  body("name").trim().notEmpty().withMessage("Project name is required"),
  body("start_date").isISO8601().withMessage("Valid start date is required"),
  body("quality").optional().isIn(["low", "medium", "high"]),
  body("status")
    .optional()
    .isIn(["not_started", "active", "on_hold", "completed", "delayed", "cancelled"]),
  body("lead_developer_id").optional({ nullable: true }).isUUID(),
  body("owner_id").optional({ nullable: true }).isUUID(),
];

const allowProjectAccess = requireRoles("admin", "project_admin");

/**
 * @swagger
 * /projects/options:
 *   get:
 *     summary: Minimal project list (id, name) for task forms
 *     tags: [Projects]
 *     security: [{ cookieAuth: [] }]
 */
router.get("/options", projectController.getOptions);

router.get("/", allowProjectAccess, projectController.getAll);
router.get(
  "/:id",
  allowProjectAccess,
  param("id").isUUID(),
  validate,
  projectController.getById
);
router.post(
  "/",
  allowProjectAccess,
  projectValidation,
  validate,
  projectController.create
);
router.put(
  "/:id",
  allowProjectAccess,
  param("id").isUUID(),
  body("name").optional().trim().notEmpty(),
  body("start_date").optional().isISO8601(),
  body("quality").optional().isIn(["low", "medium", "high"]),
  body("status")
    .optional()
    .isIn(["not_started", "active", "on_hold", "completed", "delayed", "cancelled"]),
  body("lead_developer_id").optional({ nullable: true }).isUUID(),
  body("owner_id").optional({ nullable: true }).isUUID(),
  validate,
  projectController.update
);
router.delete(
  "/:id",
  allowProjectAccess,
  param("id").isUUID(),
  validate,
  projectController.remove
);

router.get(
  "/:id/collaborators",
  allowProjectAccess,
  param("id").isUUID(),
  validate,
  projectController.getCollaborators
);
router.post(
  "/:id/collaborators",
  allowProjectAccess,
  param("id").isUUID(),
  body("project_manager_id").isUUID(),
  validate,
  projectController.addCollaborator
);
router.delete(
  "/:id/collaborators/:managerId",
  allowProjectAccess,
  param("id").isUUID(),
  param("managerId").isUUID(),
  validate,
  projectController.removeCollaborator
);

module.exports = router;
