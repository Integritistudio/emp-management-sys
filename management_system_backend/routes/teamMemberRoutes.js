const express = require("express");
const { body, param } = require("express-validator");
const teamMemberController = require("../controllers/teamMemberController");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

const memberValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("full_name").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
];

/**
 * @swagger
 * /team-members:
 *   get:
 *     summary: List team members
 *     tags: [Team]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Team members list
 *   post:
 *     summary: Create team member
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
 *     responses:
 *       201:
 *         description: Team member created
 */
router.get("/", teamMemberController.getAll);
router.get("/options/titles", teamMemberController.getTitles);
router.get("/:id", param("id").isUUID(), validate, teamMemberController.getById);
router.post("/", memberValidation, validate, teamMemberController.create);
/**
 * @swagger
 * /team-members/{id}:
 *   get:
 *     summary: Get team member by ID
 *     tags: [Team]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Team member details
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update team member
 *     tags: [Team]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Team member updated
 *   delete:
 *     summary: Delete team member
 *     tags: [Team]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Team member deleted
 */
router.put(  "/:id",
  param("id").isUUID(),
  validate,
  memberValidation,
  validate,
  teamMemberController.update
);
/**
 * @swagger
 * /team-members/{id}/matrix-rating:
 *   patch:
 *     summary: Update team member matrix rating
 *     tags: [Team]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               output_level: { type: string, enum: [low, medium, high] }
 *               quality_level: { type: string, enum: [low, medium, high] }
 *     responses:
 *       200:
 *         description: Matrix rating updated
 */
router.patch(  "/:id/matrix-rating",
  param("id").isUUID(),
  body("output_level").optional().isIn(["low", "medium", "high"]),
  body("quality_level").optional().isIn(["low", "medium", "high"]),
  validate,
  teamMemberController.updateMatrixRating
);
router.delete("/:id", param("id").isUUID(), validate, teamMemberController.remove);

module.exports = router;
