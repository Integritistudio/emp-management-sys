const express = require("express");
const { body, param } = require("express-validator");
const projectManagerController = require("../controllers/projectManagerController");
const validate = require("../middleware/validateMiddleware");
const {
  requireAdmin,
  requireRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /project-managers/options:
 *   get:
 *     summary: Minimal PM list for collaborator pickers
 *     tags: [Project Managers]
 *     security: [{ cookieAuth: [] }]
 */
router.get(
  "/options",
  requireRoles("admin", "project_admin"),
  projectManagerController.getOptions
);

router.use(requireAdmin);

router.get("/", projectManagerController.getAll);
router.get(
  "/:id",
  param("id").isUUID(),
  validate,
  projectManagerController.getById
);
router.post(
  "/",
  body("full_name").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  validate,
  projectManagerController.create
);
router.put(
  "/:id",
  param("id").isUUID(),
  body("full_name").optional().trim().notEmpty(),
  body("email").optional().isEmail(),
  body("password")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  validate,
  projectManagerController.update
);
router.delete(
  "/:id",
  param("id").isUUID(),
  validate,
  projectManagerController.remove
);

module.exports = router;
