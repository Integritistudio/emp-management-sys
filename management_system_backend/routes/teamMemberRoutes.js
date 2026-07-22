const express = require("express");
const { body, param } = require("express-validator");
const teamMemberController = require("../controllers/teamMemberController");
const validate = require("../middleware/validateMiddleware");
const { requireAdmin } = require("../middleware/authMiddleware");

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

router.use(requireAdmin);

/**
 * @swagger
 * /team-members:
 *   get:
 *     summary: List team members (admin only)
 *     tags: [Team]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Team members list
 *   post:
 *     summary: Create team member (admin only)
 *     description: Optional `password` enables member login with their email.
 *     tags: [Team]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, full_name, email]
 *             properties:
 *               title: { type: string }
 *               full_name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201:
 *         description: Team member created
 */
router.get("/", teamMemberController.getAll);
router.get("/options/titles", teamMemberController.getTitles);
router.get("/:id", param("id").isUUID(), validate, teamMemberController.getById);
router.post("/", memberValidation, validate, teamMemberController.create);
router.put(
  "/:id",
  param("id").isUUID(),
  validate,
  memberValidation,
  validate,
  teamMemberController.update
);
router.patch(
  "/:id/matrix-rating",
  param("id").isUUID(),
  body("output_level").optional().isIn(["low", "medium", "high"]),
  body("quality_level").optional().isIn(["low", "medium", "high"]),
  validate,
  teamMemberController.updateMatrixRating
);
router.delete("/:id", param("id").isUUID(), validate, teamMemberController.remove);

module.exports = router;
