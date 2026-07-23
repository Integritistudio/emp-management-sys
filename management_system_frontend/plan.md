# Integriti Employee Management System — Full Implementation Plan

**Status:** Finalized  
**Scope source:** [public/assets/Integriti Employee Management System.pdf](public/assets/Integriti%20Employee%20Management%20System.pdf)  
**Branding:** [integriti.io](https://www.integriti.io/)

---

## Scope Source (Complete PDF Coverage)

The PDF defines **23 sections**. Every item below maps directly to implementation work — nothing omitted.

| PDF Section | What We Build |
|---|---|
| 1–2 | Internal web app with **admin**, **project_admin**, and **member** logins (no public sign-up). Project admins are scoped to owned/collaborator projects; members to own data |
| 3 | Login (pre-shared credentials), Sign Out + Change Password in sidebar |
| 4 | Integriti branding + light SaaS UI |
| 5 | Sidebar: role-filtered links (admin: all + Project Managers; project_admin: main tabs; member: Dashboard, Tasks, Reports) |
| 6 | Dashboard analytics cards, date filters, team performance table, Mon–Fri breakdown |
| 7 | 3×3 Team Performance Matrix (output × quality), manual quality rating v1 |
| 8 | Projects sheet table, CRUD, detail view, task sub-table, auto variance/efficiency |
| 9 | Team card layout, add member, computed stats + matrix rating |
| 10 | Task Management sheet, full CRUD, dropdowns, auto deadline |
| 11 | Pause/resume timer logic, manual time edit, variance, bulk actions |
| 12 | Overdue completion confirmation modal (Yes/No flow) |
| 13–15 | Team Reports + Project Reports with filters and charts |
| 16–18 | Branded PDF export (Team + Project) with date range popup |
| 19 | Search, sort, filters on all sheet pages |
| 20 | Visual deadline alerts (near deadline, overdue, paused, on hold, delayed, high variance) |
| 21 | All calculation formulas enforced server-side |
| 22–23 | End-to-end flow: Login → Dashboard → Projects → Tasks → Performance → Reports → PDF |

---

## Architecture Overview

```mermaid
flowchart LR
  subgraph frontend [Frontend_NextJS]
    Pages[app_pages]
    Components[components_per_page]
    DataFiles[data_static_labels]
    ApiClient[lib_api_client]
    Pages --> Components
    Pages --> ApiClient
    Pages --> DataFiles
  end

  subgraph backend [Backend_Express]
    Routes[routes]
    Controllers[controllers]
    Models[models]
  end

  subgraph db [PostgreSQL]
    Tables[tables]
  end

  ApiClient -->|JWT_HTTPOnly| Routes
  Routes --> Controllers
  Controllers --> Models
  Models --> Tables
```

**Rule:** Dynamic data (tasks, projects, team, metrics, reports) always comes from API. Static UI copy (headings, labels, empty states, button text) lives in `data/<page>.js` files only.

---

## Phase 0 — Foundation and Standards

### 0.1 Design Tokens in `globals.css` (not separate Branding.md)

Branding colors and global design tokens live in **`app/globals.css`** as CSS variables — used across the app via Tailwind config mapping:

```css
:root {
  --color-primary: ...;       /* Integriti accent from integriti.io */
  --color-secondary: ...;
  --color-background: ...;
  --color-surface: ...;
  --color-text-primary: ...;
  --color-text-secondary: ...;
  --color-border: ...;
  --color-success: ...;
  --color-warning: ...;
  --color-danger: ...;
  --radius-card: ...;
  --shadow-card: ...;
}
```

**Rule:** `globals.css` holds only **global tokens** (colors, fonts, base resets, CSS variables). Component-specific layout, spacing, and styling stay in each component's Tailwind classes — nothing component-specific in `globals.css`.

Wire variables into `tailwind.config.js` so components use `bg-primary`, `text-secondary`, etc.

**`docs/AppleDesign.md`** — UI layout rules only (spacing, typography hierarchy, card style, transitions, skeletons). No duplicate color definitions here; colors reference `globals.css` variables.

Integriti logo in `public/images/integriti-logo.*`.

### 0.2 Documentation — Keep It Minimal

| File | Keep? | Why |
|---|---|---|
| **Swagger** (`/api/docs`) | Yes | API documentation — auto-generated, always in sync with endpoints |
| **AppleDesign.md** | Yes | UI guidelines (Apple HIG + reference to globals.css tokens) |
| **README.md** (one per project) | Yes | How to install, run, and env setup |
| **plan.md** (this file) | Yes | Complete implementation plan reference |
| ~~Branding.md~~ | No | Colors belong in `globals.css` |
| ~~SYSTEM.md~~ | No | PDF scope doc already covers system behavior |
| ~~ARCHITECTURE.md~~ | No | Folder structure is in code; Swagger covers API shape |

### 0.3 Database Setup — Auto-Create Tables on Server Start (No Manual SQL)

**Best approach for your requirements:**

| Requirement | Solution |
|---|---|
| PostgreSQL config in env | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in `.env` |
| No manual SQL scripts to run | Tables auto-created when backend starts (`npm start`) |
| Each person has their own data | Each developer/deploy uses their own `.env` pointing to their own PostgreSQL database |
| No seed data | Tables start empty; admin inserted manually in pgAdmin; rest via frontend |
| Deployment-safe | Same code runs everywhere — only env vars change |

**How it works:**

```mermaid
flowchart TD
    Start[npm start] --> Connect[Connect to PostgreSQL via env]
    Connect --> Init[db/init.js runs]
    Init --> Check{Tables exist?}
    Check -->|No| Create[CREATE TABLE IF NOT EXISTS]
    Check -->|Yes| Skip[Skip creation]
    Create --> Ready[Server ready]
    Skip --> Ready
    Ready --> Listen[Express listens on PORT]
```

1. Developer clones repo → copies `.env.example` to `.env` → sets their own PostgreSQL credentials
2. Creates an empty database in pgAdmin (e.g. `management_system`) — **only the empty database, no tables**
3. Runs `npm start` → backend connects → **`db/init.js` automatically creates all tables** if they don't exist
4. Developer inserts their own admin row in pgAdmin (one-time)
5. Another developer does the same with **their own database** — completely separate data

**Implementation:** `db/init.js` (JavaScript, not a manual `.sql` file) runs `CREATE TABLE IF NOT EXISTS` for all tables on every server start. Safe to run repeatedly — idempotent, won't drop or overwrite existing data.

**For production deployment:** Set the same env vars on your hosting platform (Railway, Render, AWS, etc.). On first deploy, tables auto-create. Point `DB_HOST` / `DB_NAME` to your production PostgreSQL instance.

**Optional production env:** `DATABASE_URL=postgresql://user:pass@host:5432/dbname` (single connection string — common on cloud hosts). Backend supports either individual vars or `DATABASE_URL`.

**What we do NOT do:**
- No `seed.sql` or seed data in code
- No requirement to run SQL files manually in pgAdmin
- No hardcoded database credentials

### 0.4 No Seeding — Data Added Manually or Via Frontend

| Data type | How it gets into the DB |
|---|---|
| **Admin account** | Insert manually in pgAdmin (email + bcrypt hashed password) — one-time setup |
| **Team, Projects, Tasks** | Added through the frontend UI after login — no seed files |

- **No seed data** in the codebase
- Tables auto-created on `npm start` via `db/init.js`
- Admin inserted manually in pgAdmin (one-time per database)
- Team, Projects, Tasks added through frontend after login

### 0.5 Admin Authentication (PostgreSQL)

- Admin email + password hash live in the `admins` table in PostgreSQL
- You add the row yourself in pgAdmin before first use
- **Only** the email and password in that table can log in
- Login API looks up admin by email, compares password with `bcrypt.compare()` against the stored hash
- No `ADMIN_EMAIL` or `ADMIN_PASSWORD` in `.env` — credentials are not in code or env files
- Only `JWT_SECRET` stays in env (for signing tokens)

**Auth flow:**

```mermaid
flowchart TD
    Visit[User opens website] --> CheckAuth{Has valid session?}
    CheckAuth -->|No| LoginPage[Show login page]
    CheckAuth -->|Yes| Dashboard[Dashboard and all pages]
    LoginPage --> Submit[Enter email + password]
    Submit --> API[POST /api/auth/login]
    API --> DBLookup[Find admin in PostgreSQL]
    DBLookup --> Bcrypt[bcrypt.compare password vs hash]
    Bcrypt -->|Valid| SetCookie[Set httpOnly JWT cookie]
    Bcrypt -->|Invalid| Error[Show error on login page]
    SetCookie --> Redirect[Redirect to /dashboard]
    Redirect --> Dashboard
    Dashboard --> Protected[All sidebar routes protected]
    Protected --> SignOut[Sign Out clears cookie]
    SignOut --> LoginPage
```

- First visit → always login page (no sign-up page)
- After successful login → redirect to `/dashboard`, full access to all sidebar pages
- `(dashboard)/layout.jsx` auth guard: unauthenticated users redirected to `/login`
- Sign Out in sidebar → `POST /api/auth/logout` → redirect to `/login`

### 0.6 Environment Variables

**Backend** (`management_system_backend/.env.example`):

```
PORT=5000
NODE_ENV=development

# PostgreSQL — each developer/deploy uses their own values
DB_HOST=localhost
DB_PORT=5432
DB_NAME=management_system
DB_USER=postgres
DB_PASSWORD=your_password

# Optional: cloud hosts often provide a single URL instead
# DATABASE_URL=postgresql://user:pass@host:5432/dbname

CLIENT_URL=http://localhost:3000
JWT_SECRET=
JWT_EXPIRES_IN=7d
PDF_BRAND_NAME=Integriti
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

No admin credentials in env — admin lives in PostgreSQL only.

**Frontend** (`.env.local.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

All secrets stay in `.env` / `.env.local` (gitignored).

### 0.7 Security Protocols

- `bcrypt` password hashing for admin
- JWT in **httpOnly, secure, sameSite** cookies (not localStorage)
- `helmet`, `cors` (restricted origin), `express-rate-limit`
- Input validation via `express-validator` on every write endpoint
- Parameterized SQL only (no string concatenation)
- Auth middleware on all routes except `POST /api/auth/login` and Swagger
- CSRF-safe cookie strategy for same-origin deployment
- Sanitize PDF/report inputs; no sensitive data in client bundles

---

## Phase 1 — Backend (Express + PostgreSQL)

### 1.1 Folder Structure

```
management_system_backend/
├── server.js                 # Calls db/init.js before listening
├── db/
│   ├── index.js              # Pool connection (reads env)
│   └── init.js               # Auto-creates tables on startup (IF NOT EXISTS)
├── models/
│   ├── adminModel.js
│   ├── teamMemberModel.js
│   ├── projectModel.js
│   ├── taskModel.js
│   ├── dashboardModel.js
│   └── reportModel.js
├── controllers/
│   ├── authController.js
│   ├── teamMemberController.js
│   ├── projectController.js
│   ├── taskController.js
│   ├── dashboardController.js
│   └── reportController.js
├── routes/
│   ├── index.js
│   ├── authRoutes.js
│   ├── teamMemberRoutes.js
│   ├── projectRoutes.js
│   ├── taskRoutes.js
│   ├── dashboardRoutes.js
│   └── reportRoutes.js
├── middleware/
│   ├── authMiddleware.js
│   ├── validateMiddleware.js
│   └── errorHandler.js
├── services/
│   ├── calculationService.js
│   ├── taskTimerService.js
│   └── pdfService.js
├── utils/
│   ├── dateFilters.js
│   └── queryBuilder.js
└── config/
    └── swagger.js
```

**One file per controller, model, and route** — no monolithic files.

### 1.2 Database Schema

```mermaid
erDiagram
    admins ||--o{ sessions : optional
    team_members ||--o{ tasks : assigned
    projects ||--o{ tasks : contains
    team_members ||--o{ projects : leads
    team_members ||--|| matrix_ratings : has

    admins {
      uuid id PK
      string email UK
      string password_hash
      timestamp created_at
    }
    team_members {
      uuid id PK
      string title
      string full_name
      string email
      enum output_level
      enum quality_level
    }
    projects {
      uuid id PK
      string name
      uuid lead_developer_id FK
      date start_date
      enum quality
      enum status
    }
    tasks {
      uuid id PK
      uuid project_id FK
      uuid assigned_to FK
      string name
      text details
      enum complexity
      enum priority
      timestamp start_time
      decimal estimated_hours
      timestamp deadline
      decimal actual_hours
      enum status
      timestamp paused_at
      decimal total_paused_hours
      timestamp completed_at
    }
    matrix_ratings {
      uuid team_member_id FK
      enum output_level
      enum quality_level
    }
```

**Enums (enforced in DB + API):**
- Project quality: Low, Medium, High
- Project status: Not Started, Active, On Hold, Completed, Delayed, Cancelled
- Task complexity: Low, Medium, High
- Task priority: Low, Medium, High, Urgent
- Task status: Not Started, In Progress, Paused, On Hold, Completed, Cancelled
- Matrix: `low | medium | high` for both output and quality

**Admin setup (manual, one-time in pgAdmin):**

```sql
INSERT INTO admins (email, password_hash)
VALUES ('admin@integriti.io', '$2b$10$...your_bcrypt_hash...');
```

Generate bcrypt hash:

```bash
node -e "console.log(require('bcrypt').hashSync('yourpassword', 10))"
```

### 1.3 Calculation Service (server-side, single source of truth)

All formulas from PDF Section 21 in `calculationService.js`:

- `taskVariance = actual - estimated`
- `projectVariance = sum(actual) - sum(estimated)`
- `efficiencyRate = (estimated / actual) * 100` (developer + project)
- `totalProjectTime = sum(actual of completed tasks)`
- `teamOutput = completed tasks in date range`
- Project-level aggregates recomputed on task create/update/complete/bulk

### 1.4 Task Timer Service (PDF Sections 11–12)

- **Create with now start** → status `in_progress`, deadline = start + estimated hours
- **Pause** → freeze deadline countdown, record `paused_at`
- **Resume** → extend deadline by paused duration, clear `paused_at`
- **Complete within estimate** → save actual from elapsed time, no modal
- **Complete after deadline** → API returns `requiresConfirmation: true`; frontend shows Yes/No modal
- **Manual edit** endpoints for start, end, estimated, actual times

### 1.5 Bulk Task Actions (PDF Section 11.6)

`PATCH /api/tasks/bulk` with actions:
- assign developer
- change status
- move project
- mark on hold
- mark completed (runs completion confirmation logic per task)

### 1.6 API Endpoints (Swagger-documented)

| Group | Key Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Team | CRUD `/team-members`, `PATCH /team-members/:id/matrix-rating` |
| Projects | CRUD `/projects`, `GET /projects/:id`, filters/search/sort |
| Tasks | CRUD `/tasks`, pause/resume/complete, bulk, filters/search/sort |
| Dashboard | `GET /dashboard/stats`, `GET /dashboard/team-performance`, `GET /dashboard/weekday-breakdown`, `GET /dashboard/matrix` |
| Reports | `GET /reports/team`, `GET /reports/team/:id`, `GET /reports/project`, `GET /reports/project/:id` |
| Export | `POST /reports/export/team-pdf`, `POST /reports/export/project-pdf` |

Query params for list endpoints: `search`, `sort`, `status`, `quality`, `developerId`, `projectId`, `complexity`, `priority`, `startDate`, `endDate`, `period` (week/month/custom).

### 1.7 Search, Sort, and Filters (High Priority — PDF Section 19)

**First-class feature** — every sheet page must have fully working filters end-to-end.

**Backend** — `utils/queryBuilder.js` builds dynamic SQL `WHERE`, `ORDER BY`, and `ILIKE` search:

| Page | Filters (all must work) |
|---|---|
| Projects | status, quality, lead developer, date range + text search on name + column sort |
| Tasks | project, developer, status, complexity, priority, date range + text search on name/details + column sort |
| Reports | team, developer, project, status, date range |
| Dashboard | week, month, custom date range (updates all widgets) |

- Filters combine with AND logic; empty filter = no restriction
- `search` param searches relevant text columns
- `sort` param: `column:asc` or `column:desc`
- Date range: `startDate` + `endDate` ISO strings
- All filter params documented in Swagger

**Frontend** — reusable `components/ui/FilterBar.jsx` + `SearchInput.jsx`:
- Filter state synced to URL query params
- Debounced search input (300ms)
- Clear-all-filters button
- Filters trigger API refetch on change
- Empty state when no results match
- Skeleton during filter refetch

### 1.8 Swagger Setup

- `swagger-jsdoc` + `swagger-ui-express`
- Served at `GET /api/docs`
- Every route documented with schemas, query params, response shapes, auth requirement

### 1.9 PDF Generation (PDF Sections 16–18)

`pdfService.js` using **PDFKit**:
- Integriti logo, report title, date range header
- Team PDF: summary table + per-developer activity breakdown
- Project PDF: project summary + task breakdown per project
- Returns downloadable PDF stream from export endpoints

---

## Phase 2 — Frontend (Next.js + Tailwind + JSX)

### 2.1 Dependencies to Add

- `lucide-react` — all icons
- `recharts` — dashboard/report charts
- `fetch` wrapper in `lib/api.js` (credentials included for cookies)

### 2.2 Folder Structure

```
management_system_frontend/
├── app/
│   ├── layout.jsx
│   ├── globals.css
│   ├── (auth)/
│   │   └── login/page.jsx
│   └── (dashboard)/
│       ├── layout.jsx
│       ├── dashboard/page.jsx
│       ├── projects/page.jsx
│       ├── projects/[id]/page.jsx
│       ├── team/page.jsx
│       ├── tasks/page.jsx
│       └── reports/page.jsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── projects/
│   ├── team/
│   ├── tasks/
│   └── reports/
├── data/
│   ├── login.js
│   ├── dashboard.js
│   ├── projects.js
│   ├── team.js
│   ├── tasks.js
│   ├── reports.js
│   └── navigation.js
├── lib/
│   ├── api.js
│   ├── auth.js
│   └── formatters.js
├── hooks/
│   ├── useAuth.js
│   ├── useDashboard.js
│   ├── useProjects.js
│   ├── useTasks.js
│   ├── useTeam.js
│   └── useReports.js
├── docs/
│   └── AppleDesign.md
├── plan.md
└── public/
    └── images/integriti-logo.*
```

**Convention:** Each `app/.../page.jsx` only composes sections from `components/<page>/`.

### 2.3 Data Folder Pattern

Static UI copy only — headings, labels, button text, empty states. API hooks supply all dynamic data.

```js
// data/dashboard.js
export const dashboardData = {
  pageTitle: "Dashboard",
  analyticsCards: [
    { key: "totalTasks", label: "Total Tasks" },
    { key: "activeTasks", label: "Currently Active Tasks" },
  ],
  filters: { week: "Week", month: "Month", custom: "Custom Range" },
};
```

### 2.4 Page-by-Page Implementation

#### Login
- Default landing for unauthenticated users
- Email + password → `POST /api/auth/login`
- Validates against `admins` table (bcrypt)
- Success → redirect `/dashboard`; failure → show error
- Integriti logo, loader on submit

#### Dashboard
- 5 analytics cards with week/month/custom filters
- Team Performance Table with horizontal bar
- Mon–Fri breakdown
- 3×3 Team Matrix
- Skeleton loaders while fetching

#### Projects
- Full sheet table, add project form, detail page with task sub-table
- Filters: status, quality, lead developer, date range + search + sort

#### Team
- Card grid, add member modal, live stats from API, matrix rating badge

#### Task Management
- Full CRUD, pause/resume/complete, bulk actions, completion modal
- Filters: project, developer, status, complexity, priority, date range
- Visual alerts: near deadline, overdue, paused, on hold, delayed, high variance

#### Reports
- Team Reports | Project Reports tabs
- Developer/project selectors, all metrics, 6 chart types (Recharts)
- PDF export with date range modal

#### Layout / Navigation
- Sidebar: Dashboard, Projects, Team, Task Management, Reports, Sign Out
- `next/link` + Lucide icons, active route highlighting
- Auth guard redirects unauthenticated users to `/login`

### 2.5 Loaders and Skeletons

- `Skeleton` — cards, table rows, charts
- `PageLoader` — route transitions
- `ButtonLoader` — form submits
- Every data section shows skeleton until API resolves

---

## Phase 3 — Frontend ↔ Backend Integration

```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant API
  participant DB

  User->>Frontend: Login
  Frontend->>API: POST /auth/login
  API->>DB: Verify admin in admins table
  API-->>Frontend: Set httpOnly JWT cookie
  Frontend->>API: GET /dashboard/stats
  API->>DB: Aggregated queries
  API-->>Frontend: JSON metrics
  Frontend-->>User: Render with skeletons removed
```

- `lib/api.js` — base URL from env, credentials included, centralized error handling
- Custom hooks wrap fetch + loading/error states
- No `fetch` calls inside presentational components

---

## Phase 4 — Implementation Order (4 Sprints)

### Sprint 1 — Foundation
- `db/init.js` auto-creates all tables on server start (no manual SQL)
- PostgreSQL connection via env vars
- Auth against PostgreSQL admin row + JWT middleware
- Swagger scaffold
- AppleDesign.md + globals.css tokens + tailwind config
- Login page + auth guard + sidebar shell
- `data/navigation.js`, `lib/api.js`

### Sprint 2 — Core CRUD
- Team members API + Team page
- Projects API + Projects page + detail page
- Tasks API + Task Management page (basic CRUD)

### Sprint 3 — Business Logic
- Calculation service, task timer, bulk actions
- Dashboard stats, team performance, weekday breakdown, matrix
- Completion confirmation modal

### Sprint 4 — Reports and Polish
- Team + Project reports with Recharts
- PDF export
- Search/sort/filters verified on all sheet pages
- Visual deadline alerts, skeletons/loaders
- README per project

---

## Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Charts | Recharts | Attractive React charts for dashboards |
| Icons | Lucide React | Consistent, lightweight |
| PDF | PDFKit (backend) | Server-side branded export |
| Auth | JWT httpOnly cookie | Secure admin session |
| Admin login | PostgreSQL `admins` table | Only pgAdmin-inserted credentials can log in |
| Quality rating v1 | Manual admin selection | PDF requirement |
| Static UI text | `data/<page>.js` | Easy edits without touching components |
| API docs | Swagger at `/api/docs` | Auto-generated API reference |
| Branding colors | `globals.css` CSS variables | Single source; components use Tailwind |
| Database setup | Auto-init on `npm start` via `db/init.js` | No manual SQL; each env has its own DB via env vars |
| Data entry | Frontend forms + manual admin in pgAdmin | No seed files |

---

## Definition of Done

- [ ] Admin login against PostgreSQL `admins` table (manual pgAdmin insert), no sign-up
- [ ] First visit shows login; after login redirect to dashboard and all pages accessible
- [ ] All 5 sidebar routes functional and linked
- [ ] Dashboard: 5 cards + filters + team table + Mon–Fri + 3×3 matrix
- [ ] Projects: full table, add, detail, task sub-table, auto calculations
- [ ] Team: card layout, add member, live stats
- [ ] Tasks: full CRUD, timer pause/resume, bulk actions, completion modal
- [ ] Reports: team + project tabs, all metrics, 6 chart types
- [ ] PDF export: team + project with date filter and Integriti branding
- [ ] Search/sort/filters fully working on Projects, Tasks, Reports, Dashboard
- [ ] Visual alerts on tasks (6 conditions)
- [ ] All 7 formulas correct server-side
- [ ] Swagger complete at `/api/docs`
- [ ] Design tokens in globals.css; no component CSS in globals
- [ ] Tables auto-create on backend start — no manual SQL scripts required
- [ ] PostgreSQL config fully in `.env` (per-environment)
- [ ] No seed files — admin in pgAdmin; team/projects/tasks via frontend
- [ ] No hardcoded dynamic data in components
- [ ] Env-based config for DB and JWT secrets only
- [ ] Security: helmet, rate limit, validation, bcrypt, httpOnly JWT
