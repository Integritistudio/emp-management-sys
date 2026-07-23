const express = require("express");
const { body, param } = require("express-validator");
const teamMemberController = require("../controllers/teamMemberController");
const validate = require("../middleware/validateMiddleware");
const {
  requireAdmin,
  requireRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

const memberValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("full_name").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const allowTeamRead = requireRoles("admin", "project_admin");

/**
 * @swagger
 * /team-members:
 *   get:
 *     summary: List team members (admin and project admin)
 *     tags: [Team]
 *     security: [{ cookieAuth: [] }]
 */
router.get("/", allowTeamRead, teamMemberController.getAll);
router.get(
  "/options/titles",
  allowTeamRead,
  teamMemberController.getTitles
);
router.get(
  "/:id",
  allowTeamRead,
  param("id").isUUID(),
  validate,
  teamMemberController.getById
);

router.post("/", requireAdmin, memberValidation, validate, teamMemberController.create);
router.put(
  "/:id",
  requireAdmin,
  param("id").isUUID(),
  validate,
  memberValidation,
  validate,
  teamMemberController.update
);
router.patch(
  "/:id/matrix-rating",
  requireAdmin,
  param("id").isUUID(),
  body("output_level").optional().isIn(["low", "medium", "high"]),
  body("quality_level").optional().isIn(["low", "medium", "high"]),
  validate,
  teamMemberController.updateMatrixRating
);
router.delete(
  "/:id",
  requireAdmin,
  param("id").isUUID(),
  validate,
  teamMemberController.remove
);

module.exports = router;
