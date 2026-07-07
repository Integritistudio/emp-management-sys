# Integriti Employee Management System — Backend Overview

> **Living document.** Update this file whenever backend behaviour, APIs, or architecture changes.

## Table of contents

1. [Purpose](#purpose)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Running locally](#running-locally)
5. [Environment variables](#environment-variables)
6. [Authentication](#authentication)
7. [API surface](#api-surface)
8. [Database](#database)
9. [Business rules](#business-rules)
10. [Services layer](#services-layer)
11. [Module reference](#module-reference)
12. [Swagger documentation](#swagger-documentation)
13. [Error handling](#error-handling)
14. [Change log](#change-log)

---

## Purpose

Node/Express REST API for the Integriti internal employee management platform. Single admin user manages projects, tasks, team members, dashboards, and PDF reports.

Specification source: `management_system_frontend/public/assets/Integriti Employee Management System.pdf`

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | PostgreSQL (`pg`) |
| Auth | JWT in httpOnly cookie |
| Validation | express-validator |
| API docs | swagger-jsdoc + swagger-ui-express |
| PDF export | PDFKit |

---

## Project structure

```
management_system_backend/
├── server.js              # Entry point, middleware, Swagger UI
├── db/
│   ├── index.js           # PostgreSQL pool
│   └── init.js            # Schema bootstrap
├── config/
│   ├── swagger.js         # OpenAPI generator config
│   ├── swaggerSchemas.js  # Shared schemas & response types
│   └── businessHours.js   # Office shift configuration
├── routes/                # Express routers (+ Swagger JSDoc)
├── controllers/           # HTTP handlers (thin)
├── models/                # SQL queries & data mapping
├── services/              # Business logic (calculations, timer, PDF)
├── middleware/            # auth, validation, logging, errors
└── utils/                 # queryBuilder, etc.
```

**Request flow:** `Route → validate → Controller → Model/Service → PostgreSQL → JSON response`

---

## Running locally

```bash
cd management_system_backend
npm install
# Configure .env (see below)
npm run dev    # auto-restart on file change
# or
npm start      # manual restart required
```

- API base: `http://localhost:5000/api`
- Swagger UI: `http://localhost:5000/api/docs`
- Health: `GET /api/health`

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Token signing secret |
| `PORT` | No | 5000 | Server port |
| `CLIENT_URL` | No | `http://localhost:3000` | CORS allowed origin(s), comma-separated |
| `OFFICE_START_HOUR` | No | 17 | Office shift start (5 PM) |
| `OFFICE_END_HOUR` | No | 2 | Office shift end (2 AM next day) |
| `OFFICE_UTC_OFFSET_MINUTES` | No | 300 | Office timezone offset (UTC+5 Pakistan) |

---

## Authentication

- `POST /api/auth/login` — email + password → sets `token` httpOnly cookie
- `GET /api/auth/me` — returns current admin (requires cookie)
- `POST /api/auth/logout` — clears cookie
- All other routes use `authMiddleware` (except `/health` and login)

---

## API surface

| Prefix | Module |
|--------|--------|
| `/auth` | Login, logout, session |
| `/team-members` | Team CRUD + matrix rating |
| `/projects` | Project CRUD + aggregated task metrics |
| `/tasks` | Task CRUD, pause/resume/complete, bulk actions |
| `/dashboard` | Stats, team performance, weekday breakdown, matrix |
| `/reports` | Team/project reports, PDF export |

Full interactive docs: **`/api/docs`**

---

## Database

Main tables: `admins`, `team_members`, `projects`, `tasks`

### Task columns (timer-related)

| Column | Purpose |
|--------|---------|
| `start_time` | When work started |
| `deadline` | Expected end (office-hours aware) |
| `estimated_hours` | Planned duration |
| `actual_hours` | Recorded work time (set on completion) |
| `paused_at` | When pause began (null if running) |
| `total_paused_hours` | Cumulative paused duration |
| `completed_at` | When marked completed |
| `status` | not_started \| in_progress \| paused \| on_hold \| completed \| cancelled |

---

## Business rules

### Office hours & deadlines (PDF 10.11)

Deadlines count only time inside the office shift (**5 PM → 2 AM** by default).

**Example:** Start 11:00 PM + 5 estimated hours → deadline **7:00 PM next day** (not 4:00 AM).

Implementation: `services/businessHoursService.js` → `addBusinessHours()`  
Used by: `calculationService.addHoursToDate()` on task create and deadline recalculation.

Pause/resume extends deadline by **wall-clock** paused duration (`addWallClockHours`).

### Task timer (PDF 11)

| Action | Behaviour |
|--------|-----------|
| Create with current time | `status = in_progress`, `start_time = now` |
| Pause | `status = paused`, `paused_at = now`, elapsed time stops |
| Resume | Adds pause duration to `total_paused_hours`, extends `deadline` |
| Complete (on time) | `actual_hours = elapsed − pauses`, no popup |
| Complete (overdue) | Returns `requiresConfirmation`; Yes = manual hours, No = elapsed |

Completing via **PUT** (edit form) also auto-fills `actual_hours` unless manually provided.

### Team metrics (PDF 9.5, 21.3)

- **Total time logged** = sum of `actual_hours` on **completed** tasks only
- **Efficiency** = `(completed estimated / completed actual) × 100`

### Project metrics (PDF 8.7–8.9)

- `total_estimated_time` = all tasks
- `total_project_time` = completed tasks actual only
- Variance & efficiency use **completed** estimated vs actual (like-for-like)

---

## Services layer

| File | Responsibility |
|------|----------------|
| `calculationService.js` | Variance, efficiency, deadline helpers |
| `businessHoursService.js` | Office-hours deadline arithmetic |
| `taskTimerService.js` | Elapsed time, pause/resume/complete logic |
| `pdfService.js` | Branded PDF generation |

---

## Module reference

### Tasks (`models/taskModel.js`)

- `create` — sets start, status, office-hours deadline
- `update` — auto actual_hours on completion; preserves pause-extended deadline
- `pause` / `resume` / `complete` — timer endpoints
- `bulkUpdate` — assign, change_status, move_project, on_hold, complete

### Team (`models/teamMemberModel.js`)

- Aggregates per-developer stats via `LEFT JOIN LATERAL`
- `updateMatrixRating` — output/quality levels for dashboard matrix

### Reports (`models/reportModel.js`)

- Date-range filtered team/project summaries and chart data
- PDF export data assembly

---

## Swagger documentation

- **URL:** `http://localhost:5000/api/docs`
- **Config:** `config/swagger.js`
- **Schemas:** `config/swaggerSchemas.js`
- **Route docs:** JSDoc `@swagger` blocks in `routes/*.js`

When adding a new endpoint:
1. Add route + validation + controller
2. Add `@swagger` block above the route
3. Reuse `$ref` schemas from `swaggerSchemas.js`
4. Update this document's API surface table

---

## Error handling

- `middleware/validateMiddleware.js` — 400 on validation failure
- `middleware/errorHandler.js` — centralised 500 handler
- Controllers return 404 for missing resources, 400 for business rule violations

---

## Change log

| Date | Change |
|------|--------|
| 2026-07-07 | Office-hours deadline calculation (5 PM–2 AM) |
| 2026-07-07 | Auto actual_hours on completion via update path |
| 2026-07-07 | Completed-only efficiency/time-logged alignment |
| 2026-07-07 | Expanded Swagger schemas and task endpoint docs |
| 2026-07-07 | Initial PROJECT_OVERVIEW.md |

---

*Last updated: 2026-07-07*
