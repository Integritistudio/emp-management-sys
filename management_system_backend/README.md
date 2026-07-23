# Management System Backend

Integriti Employee Management System API.

## Setup

1. Copy `.env.example` to `.env` and fill in your PostgreSQL credentials and `JWT_SECRET`.
2. Create an empty database in pgAdmin (e.g. `employee_management_system`).
3. Run `npm install`
4. Run `npm start` — tables are auto-created on startup (including `team_members.password_hash`).

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

Or run `node db/seedAdmin.js` with `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

## Member login

1. As admin, open **Team** → Add/Edit member.
2. Enter a **login password** (min 6 characters) for that member.
3. The member signs in at the same login page with their **email + password**.
4. Either role can change their password via **Change Password** (current password required).

Members cannot access Team or Projects APIs (except `GET /projects/options` for task create). Their tasks and dashboard/report data are scoped to themselves.

## Scripts

- `npm start` — start server
- `npm run dev` — start with file watch

## API Docs

Swagger UI: `http://localhost:5000/api/docs`

## Features

- Admin + project admin + team member auth (JWT httpOnly cookie)
- Change password (`POST /auth/change-password`)
- Project Managers CRUD (admin); project ownership + collaborators
- Team, Projects, Tasks CRUD with role scoping
- Task timer (pause/resume/complete) and bulk actions
- Dashboard analytics (org-wide for admin; project-scoped for PMs; personal for members)
- Reports API with chart data; members see own report
- Branded PDF export (PDFKit)

## Project admin quick start

1. As super-admin, open **Project Managers** → create account (email + password).
2. Project admin signs in and creates projects (they become owner).
3. On a project detail page, add other project managers as **Collaborators**.
4. Collaborators see that project's tasks, dashboard stats, and reports.

## Report Endpoints

- `GET /api/reports/team` — team reports overview (member → own report)
- `GET /api/reports/me` — current member's report
- `GET /api/reports/team/:id` — single developer report (members: self only)
- `GET /api/reports/project` — project reports overview (admin)
- `GET /api/reports/project/:id` — single project report (admin)
- `POST /api/reports/export/team-pdf` — download team PDF
- `POST /api/reports/export/project-pdf` — download project PDF (admin)

Query/body filters: `period`, `startDate`, `endDate`, `developerId`, `projectId`, `status`
