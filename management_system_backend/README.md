# Management System Backend

Integriti Employee Management System API.

## Setup

1. Copy `.env.example` to `.env` and fill in your PostgreSQL credentials and `JWT_SECRET`.
2. Create an empty database in pgAdmin (e.g. `employee_management_system`).
3. Run `npm install`
4. Run `npm start` — tables are auto-created on startup.

## Add Admin (one-time, in pgAdmin)

Generate a bcrypt hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
```

Insert into `admins` table:

```sql
INSERT INTO admins (email, password_hash)
VALUES ('admin@integriti.io', '$2b$10$...your_hash...');
```

## Scripts

- `npm start` — start server
- `npm run dev` — start with file watch

## API Docs

Swagger UI: `http://localhost:5000/api/docs`

## Features

- Admin auth (JWT httpOnly cookie)
- Team, Projects, Tasks CRUD with search/sort/filters
- Task timer (pause/resume/complete) and bulk actions
- Dashboard analytics (stats, team performance, weekday breakdown, matrix)
- Reports API with chart data
- Branded PDF export (PDFKit) for team and project reports

## Report Endpoints

- `GET /api/reports/team` — team reports overview
- `GET /api/reports/team/:id` — single developer report
- `GET /api/reports/project` — project reports overview
- `GET /api/reports/project/:id` — single project report
- `POST /api/reports/export/team-pdf` — download team PDF
- `POST /api/reports/export/project-pdf` — download project PDF

Query/body filters: `period`, `startDate`, `endDate`, `developerId`, `projectId`, `status`
