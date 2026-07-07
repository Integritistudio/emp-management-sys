# Integriti Employee Management System — Frontend Overview

> **Living document.** Update this file whenever UI behaviour, routes, or architecture changes.

## Table of contents

1. [Purpose](#purpose)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Running locally](#running-locally)
5. [Environment variables](#environment-variables)
6. [Routing & pages](#routing--pages)
7. [Layout & auth](#layout--auth)
8. [Data layer](#data-layer)
9. [Hooks](#hooks)
10. [UI components](#ui-components)
11. [Module guides](#module-guides)
12. [Design system](#design-system)
13. [Date & time handling](#date--time-handling)
14. [Change log](#change-log)

---

## Purpose

Next.js (App Router) admin dashboard for Integriti's internal employee management system. Connects to the Express API at `http://localhost:5000/api`.

Specification: `public/assets/Integriti Employee Management System.pdf`

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| UI | React, Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| API | Native `fetch` with credentials |

---

## Project structure

```
management_system_frontend/
├── app/                    # Next.js routes
│   ├── (auth)/login/       # Public login page
│   ├── (dashboard)/        # Protected pages (sidebar layout)
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── team/
│   │   ├── tasks/
│   │   └── reports/
│   ├── layout.jsx          # Root layout
│   └── globals.css         # Design tokens & base styles
├── components/
│   ├── layout/             # Sidebar, DashboardShell
│   ├── ui/                 # Button, Card, Modal, Table, etc.
│   ├── dashboard/          # Dashboard widgets
│   ├── projects/           # Projects list & detail
│   ├── team/               # Team cards & forms
│   ├── tasks/              # Task table, form, bulk, completion modal
│   ├── reports/            # Reports tabs & charts
│   └── login/
├── hooks/                  # useAuth, useTasks, useTeam, etc.
├── lib/                    # API clients, formatters, utilities
├── data/                   # Static copy & option lists (no API calls)
├── public/images/          # logo.webp
├── DESIGN-apple.md         # UI design reference
├── io.css                  # Brand colour reference
└── PROJECT_OVERVIEW.md     # This file
```

---

## Running locally

```bash
cd management_system_frontend
npm install
npm run dev     # http://localhost:3000
```

Backend must be running on port 5000.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend API base URL |

---

## Routing & pages

| Route | Page component | Description |
|-------|----------------|-------------|
| `/` | redirect | → `/login` or `/dashboard` |
| `/login` | `LoginForm` | Admin authentication |
| `/dashboard` | `DashboardPageContent` | Analytics cards, team performance, matrix |
| `/projects` | `ProjectsPageContent` | Project listing table |
| `/projects/[id]` | `ProjectDetailContent` | Single project + tasks |
| `/team` | `TeamPageContent` | Team member cards |
| `/tasks` | `TasksPageContent` | Task management sheet |
| `/reports` | `ReportsPageContent` | Team & project reports + PDF export |

All dashboard routes are wrapped in `(dashboard)/layout.jsx` → `DashboardShell` (sidebar + scrollable main).

---

## Layout & auth

### `DashboardShell.jsx`
- Fixed-height sidebar (`w-[220px]`), main content scrolls independently
- Passes `adminEmail` to sidebar for "Signed in as" above Sign Out

### `useAuth` hook
- Checks `GET /auth/me` on load
- Redirects unauthenticated users to `/login`
- Login sets httpOnly cookie (handled by backend)

### `lib/api.js`
- Central `request()` with `credentials: "include"`
- `ApiError` class for user-facing error messages
- Module-specific clients: `lib/tasks.js`, `lib/team.js`, `lib/projects.js`, etc.

---

## Data layer

### `data/` folder
Static UI strings and dropdown options — **not** fetched from API.

| File | Used by |
|------|---------|
| `navigation.js` | Sidebar links, brand, logo path |
| `tasks.js` | Task page labels, status options, completion modal text |
| `team.js` | Team page copy |
| `common.js` | ConfirmDialog messages |
| `login.js` | Login page copy |

### `lib/` folder
API integration and utilities.

| File | Purpose |
|------|---------|
| `api.js` | Base fetch wrapper |
| `tasks.js` | Task API calls (CRUD, pause, resume, complete, bulk) |
| `team.js` | Team member API |
| `projects.js` | Project API |
| `dashboard.js` | Dashboard stats API |
| `reports.js` | Reports & PDF download |
| `formatters.js` | Dates, hours, percent, status badges |
| `sort.js` | Table sort cycle helper |
| `taskAlerts.js` | Overdue/near-deadline visual flags |

---

## Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Session state, login/logout |
| `useTasks` | Task list + mutations; accepts filter params |
| `useTeam` | Team members; debounced search; race-condition safe |
| `useProjects` | Project list |
| `useDashboard` | Dashboard stats & charts |
| `useReports` | Report data & PDF export |
| `useDebouncedValue` | 400ms debounce for search inputs |

**Pattern:** hooks own `loading`/`error` state, expose CRUD functions, refetch after mutations.

---

## UI components

Reusable primitives in `components/ui/`:

| Component | Usage |
|-----------|-------|
| `Button` | Primary/secondary/danger/ghost variants |
| `Card` | Content containers (no shadow per Apple design) |
| `Input`, `Select`, `SearchInput` | Form fields |
| `Modal` | Dialogs |
| `ConfirmDialog` | Delete confirmations (replaces `window.confirm`) |
| `Table`, `SortableHeader` | Sheet-style data tables |
| `FilterBar` | Search + dropdown filters + date range |
| `Badge` | Status/quality labels |
| `EmptyState`, `TableSkeleton` | Loading & empty UX |

---

## Module guides

### Tasks (`components/tasks/`)

**`TasksPageContent.jsx`** — orchestrates filters, table, modals, bulk actions.

**`TaskForm.jsx`**
- Create: "Use current time" checkbox → `use_current_time: true` → backend sets In Progress + now
- Edit: manual Start Time, Deadline/End Time, Actual Time
- Status `completed` + empty actual → backend auto-calculates on save

**`CompletionModal.jsx`** — PDF 12.2 overdue flow (Yes = manual hours, No = elapsed)

**`BulkActionsBar.jsx`** — assign, change status, move project, on hold, complete

**Timer actions** in table: Pause, Resume, Complete buttons call dedicated API endpoints.

### Team (`components/team/`)

- Card grid layout with stats from backend aggregation
- Search debounced 400ms → `useTeam({ search })`
- `ConfirmDialog` for delete

### Projects (`components/projects/`)

- Sheet table with variance & efficiency columns
- Detail page shows linked tasks sub-table

### Reports (`components/reports/`)

- Team / Project tab switch
- Charts via Recharts
- PDF export modal with date range

---

## Design system

- **Tokens:** `app/globals.css` CSS variables (`--integriti-primary`, etc.)
- **Tailwind:** `tailwind.config.js` maps tokens to utilities
- **Reference:** `DESIGN-apple.md`, `io.css`
- **Page headings:** `.heading-page` class (green `#004d4d`)
- **Sidebar:** Integriti secondary purple, neutral text

---

## Date & time handling

### Why times looked wrong (1:34 PM vs 6:34 PM)

The API stores timestamps in **UTC** (ISO 8601). The edit form uses `<input type="datetime-local">`, which expects **local** time.

**Bug (fixed):** `new Date(iso).toISOString().slice(0, 16)` converts to UTC first → shows 5 hours early in Pakistan (UTC+5).

**Fix:** `lib/formatters.js`
- `toDatetimeLocalValue(iso)` — display in browser local time
- `fromDatetimeLocalValue(local)` — send back as ISO UTC

Tables use `formatDateTime()` which calls `toLocaleString()` — always correct local display.

### Office hours deadlines

Configured on the **backend** (5 PM–2 AM). Frontend displays the deadline returned by the API; no separate client-side calculation.

---

## Change log

| Date | Change |
|------|--------|
| 2026-07-07 | Fixed datetime-local timezone display |
| 2026-07-07 | TaskForm: In Progress default with use_current_time |
| 2026-07-07 | TaskForm: Deadline/End Time manual edit field |
| 2026-07-07 | ConfirmDialog replaces browser confirm |
| 2026-07-07 | Apple/Integriti design system applied |
| 2026-07-07 | Initial PROJECT_OVERVIEW.md |

---

*Last updated: 2026-07-07*
