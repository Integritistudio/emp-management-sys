const express = require("express");
const { body, param } = require("express-validator");
const taskController = require("../controllers/taskController");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

const taskValidation = [
  body("name").trim().notEmpty().withMessage("Task name is required"),
  body("project_id").isUUID().withMessage("Valid project is required"),
  body("estimated_hours")
    .isFloat({ min: 0.1 })
    .withMessage("Estimated hours must be greater than 0"),
  body("complexity").optional().isIn(["low", "medium", "high"]),
  body("priority").optional().isIn(["low", "medium", "high", "urgent"]),
  body("status")
    .optional()
    .isIn([
      "not_started",
      "in_progress",
      "paused",
      "on_hold",
      "completed",
      "cancelled",
    ]),
  body("assigned_to").optional({ nullable: true }).isUUID(),
];

const bulkValidation = [
  body("taskIds").isArray({ min: 1 }).withMessage("At least one task ID is required"),
  body("taskIds.*").isUUID(),
  body("action")
    .isIn(["assign", "change_status", "move_project", "on_hold", "complete"])
    .withMessage("Invalid bulk action"),
  body("value").optional(),
  body("confirm").optional().isBoolean(),
];

router.get("/", taskController.getAll);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List tasks with filters and sorting
 *     tags: [Tasks]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/searchQuery'
 *       - $ref: '#/components/parameters/sortQuery'
 *       - in: query
 *         name: projectId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: developerId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [not_started, in_progress, paused, on_hold, completed, cancelled] }
 *       - in: query
 *         name: complexity
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, urgent] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Task list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Task' }
 *                 count: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     summary: Create a task
 *     description: |
 *       With `use_current_time: true` (default on frontend), start_time is set to now and status defaults to `in_progress`.
 *       Deadline is computed as start + estimated_hours within office hours (5 PM–2 AM).
 *     tags: [Tasks]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TaskCreate' }
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Task' }
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /tasks/bulk:
 *   patch:
 *     summary: Bulk update tasks
 *     description: |
 *       Actions: `assign`, `change_status`, `move_project`, `on_hold`, `complete`.
 *       For `complete`, overdue tasks may return `requiresConfirmation: true` per task; resubmit with `confirm: true`.
 *     tags: [Tasks]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BulkTaskRequest' }
 *     responses:
 *       200:
 *         description: Bulk action results
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/bulk", bulkValidation, validate, taskController.bulkUpdate);

router.post("/", taskValidation, validate, taskController.create);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Task' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update a task
 *     description: |
 *       Setting status to `completed` auto-fills actual_hours from the timer unless `actual_hours` is provided.
 *       Deadline is only recalculated when start_time or estimated_hours change.
 *     tags: [Tasks]
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
 *             allOf:
 *               - { $ref: '#/components/schemas/TaskCreate' }
 *               - type: object
 *                 properties:
 *                   actual_hours: { type: number }
 *                   deadline: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", param("id").isUUID(), validate, taskController.getById);
router.put(
  "/:id",
  param("id").isUUID(),
  body("name").optional().trim().notEmpty(),
  body("project_id").optional().isUUID(),
  body("estimated_hours").optional().isFloat({ min: 0.1 }),
  body("complexity").optional().isIn(["low", "medium", "high"]),
  body("priority").optional().isIn(["low", "medium", "high", "urgent"]),
  body("status")
    .optional()
    .isIn([
      "not_started",
      "in_progress",
      "paused",
      "on_hold",
      "completed",
      "cancelled",
    ]),
  body("assigned_to").optional({ nullable: true }).isUUID(),
  body("actual_hours").optional().isFloat({ min: 0 }),
  body("deadline").optional().isISO8601(),
  validate,
  taskController.update
);
router.delete("/:id", param("id").isUUID(), validate, taskController.remove);

/**
 * @swagger
 * /tasks/{id}/pause:
 *   post:
 *     summary: Pause task timer
 *     description: Only `in_progress` tasks. Stops elapsed-time counting (PDF 11.2).
 *     tags: [Tasks]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task paused
 *       400:
 *         description: Task cannot be paused
 */
router.post("/:id/pause", param("id").isUUID(), validate, taskController.pause);

/**
 * @swagger
 * /tasks/{id}/resume:
 *   post:
 *     summary: Resume task timer
 *     description: Extends deadline by the paused duration (PDF 11.3).
 *     tags: [Tasks]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task resumed
 *       400:
 *         description: Task is not paused
 */
router.post("/:id/resume", param("id").isUUID(), validate, taskController.resume);

/**
 * @swagger
 * /tasks/{id}/complete:
 *   post:
 *     summary: Complete task
 *     description: |
 *       **Within deadline (PDF 12.1):** auto-calculates actual_hours from elapsed work time.
 *       **Overdue (PDF 12.2–12.4):** returns `requiresConfirmation: true` until `confirm: true` is sent.
 *       - Yes → supply `actual_hours` manually
 *       - No → uses elapsed time
 *     tags: [Tasks]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TaskCompleteRequest' }
 *     responses:
 *       200:
 *         description: Task completed or confirmation required
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message: { type: string }
 *                     data: { $ref: '#/components/schemas/Task' }
 *                 - type: object
 *                   properties:
 *                     requiresConfirmation: { type: boolean, example: true }
 *                     message: { type: string }
 *                     elapsed_hours: { type: number }
 *                     data: { $ref: '#/components/schemas/Task' }
 *       400:
 *         description: Task already finished
 */
router.post(
  "/:id/complete",
  param("id").isUUID(),
  body("confirm").optional().isBoolean(),
  body("actual_hours").optional().isFloat({ min: 0 }),
  validate,
  taskController.complete
);

module.exports = router;
