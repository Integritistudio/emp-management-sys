const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Integriti Employee Management System API",
      version: "1.0.0",
      description: `
REST API for the Integriti internal employee management platform.

## Authentication
All routes except \`POST /auth/login\` and \`GET /health\` require a valid JWT stored in the **httpOnly cookie** named \`token\`.
Send requests with \`credentials: include\` from the browser.

## Office hours & deadlines
Task deadlines count only working time inside the configured office shift (default **5:00 PM – 2:00 AM**, UTC+5).
Example: task at 11:00 PM with 5 estimated hours → deadline **7:00 PM next day**, not 4:00 AM.

Configure via environment:
- \`OFFICE_START_HOUR\` (default 17)
- \`OFFICE_END_HOUR\` (default 2)
- \`OFFICE_UTC_OFFSET_MINUTES\` (default 300 for Pakistan)

## Task timer (PDF sections 11–12)
- **Pause**: stops elapsed-time counting; deadline extension applied on resume.
- **Complete (within deadline)**: actual_hours = elapsed work time (minus pauses); completed_at = start + actual (office hours).
- **Complete (overdue, Yes)**: supply manual actual_hours; completed_at = start + actual (office hours).
- **Complete (overdue, No)**: actual_hours = elapsed; completed_at = start + actual (office hours).
- Pause/on-hold freeze the deadline timer and are excluded from elapsed; they do **not** extend completed_at.
- Overdue completion returns \`requiresConfirmation: true\`; Yes = manual hours, No = elapsed.

## Key calculations
| Metric | Formula |
|--------|---------|
| Task variance | actual − estimated |
| Efficiency | (estimated / actual) × 100 |
| Team time logged | sum of actual_hours on **completed** tasks only |
      `.trim(),
      contact: {
        name: "Integriti Engineering",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Local development",
      },
    ],
    tags: [
      { name: "Health", description: "Service health check" },
      { name: "Auth", description: "Admin login, logout, session" },
      { name: "Team", description: "Team members and matrix ratings" },
      { name: "Projects", description: "Project CRUD and aggregated metrics" },
      { name: "Tasks", description: "Task CRUD, timer, bulk actions, completion" },
      { name: "Dashboard", description: "Analytics cards, team performance, matrix" },
      { name: "Reports", description: "Team/project reports and PDF export" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT issued on successful login",
        },
      },
    },
  },
  apis: ["./config/swaggerSchemas.js", "./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
