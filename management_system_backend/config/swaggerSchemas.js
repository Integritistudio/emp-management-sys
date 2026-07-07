/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Validation failed
 *
 *     Admin:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *
 *     TeamMember:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         title: { type: string, example: Senior Developer }
 *         full_name: { type: string }
 *         email: { type: string, format: email }
 *         output_level: { type: string, enum: [low, medium, high] }
 *         quality_level: { type: string, enum: [low, medium, high] }
 *         total_tasks_assigned: { type: integer }
 *         total_time_logged: { type: number, description: Sum of actual_hours on completed tasks }
 *         efficiency_rate: { type: number, description: "(completed estimated / completed actual) × 100" }
 *         matrix_rating: { type: string, example: "medium output / high quality" }
 *
 *     Project:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string }
 *         lead_developer_id: { type: string, format: uuid, nullable: true }
 *         lead_developer_name: { type: string, nullable: true }
 *         start_date: { type: string, format: date }
 *         quality: { type: string, enum: [low, medium, high] }
 *         status: { type: string, enum: [not_started, active, on_hold, completed, delayed, cancelled] }
 *         total_tasks: { type: integer }
 *         total_estimated_time: { type: number }
 *         total_actual_time: { type: number }
 *         total_project_time: { type: number, description: Completed tasks actual hours only }
 *         project_variance: { type: number }
 *         project_efficiency_rate: { type: number }
 *
 *     Task:
 *       type: object
 *       description: |
 *         Task entity. Deadlines are computed using office hours (default 5 PM–2 AM).
 *         Actual hours on completion are auto-calculated from the timer unless manually supplied.
 *       properties:
 *         id: { type: string, format: uuid }
 *         project_id: { type: string, format: uuid }
 *         project_name: { type: string }
 *         assigned_to: { type: string, format: uuid, nullable: true }
 *         assigned_to_name: { type: string, nullable: true }
 *         name: { type: string }
 *         details: { type: string, nullable: true }
 *         complexity: { type: string, enum: [low, medium, high] }
 *         priority: { type: string, enum: [low, medium, high, urgent] }
 *         start_time: { type: string, format: date-time }
 *         estimated_hours: { type: number, minimum: 0.1 }
 *         deadline: { type: string, format: date-time, description: Start + estimated within office hours }
 *         actual_hours: { type: number, nullable: true }
 *         variance: { type: number, nullable: true, description: actual_hours - estimated_hours }
 *         status: { type: string, enum: [not_started, in_progress, paused, on_hold, completed, cancelled] }
 *         paused_at: { type: string, format: date-time, nullable: true }
 *         total_paused_hours: { type: number }
 *         completed_at: { type: string, format: date-time, nullable: true }
 *
 *     TaskCreate:
 *       type: object
 *       required: [name, project_id, estimated_hours]
 *       properties:
 *         name: { type: string }
 *         project_id: { type: string, format: uuid }
 *         details: { type: string }
 *         complexity: { type: string, enum: [low, medium, high] }
 *         priority: { type: string, enum: [low, medium, high, urgent] }
 *         assigned_to: { type: string, format: uuid, nullable: true }
 *         estimated_hours: { type: number, minimum: 0.1 }
 *         status: { type: string }
 *         use_current_time: { type: boolean, description: "If true, start_time=now and status defaults to in_progress (PDF 11.1)" }
 *         start_time: { type: string, format: date-time }
 *
 *     TaskCompleteRequest:
 *       type: object
 *       properties:
 *         confirm: { type: boolean, description: "Required true after overdue confirmation popup (PDF 12.2)" }
 *         actual_hours: { type: number, description: "Manual actual time when admin answers Yes on overdue popup" }
 *
 *     BulkTaskRequest:
 *       type: object
 *       required: [taskIds, action]
 *       properties:
 *         taskIds: { type: array, items: { type: string, format: uuid } }
 *         action: { type: string, enum: [assign, change_status, move_project, on_hold, complete] }
 *         value: { description: "Developer UUID, status string, or project UUID depending on action" }
 *         confirm: { type: boolean, description: "For bulk complete after overdue confirmation" }
 *
 *     DateRangeQuery:
 *       type: object
 *       properties:
 *         period: { type: string, enum: [week, month, custom] }
 *         startDate: { type: string, format: date }
 *         endDate: { type: string, format: date }
 *
 *   parameters:
 *     sortQuery:
 *       in: query
 *       name: sort
 *       schema: { type: string }
 *       description: "Column and direction, e.g. name:asc or created_at:desc"
 *     searchQuery:
 *       in: query
 *       name: search
 *       schema: { type: string }
 *
 *   responses:
 *     Unauthorized:
 *       description: Not authenticated (missing or invalid JWT cookie)
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 */

module.exports = {};
