# Management System Frontend

Integriti Employee Management System — Next.js frontend.

## Setup

1. Copy `.env.local.example` to `.env.local` (or create with `NEXT_PUBLIC_API_URL=http://localhost:5000/api`)
2. Run `npm install`
3. Run `npm run dev` → http://localhost:3000 (or next available port)
4. Ensure the backend is running at `http://localhost:5000`

## Features

- **Login** — Admin, project admin, or team member (email + password, JWT cookie)
- **Change Password** — Sidebar action; requires current password
- **Dashboard** — Admin: org analytics. Project admin: scoped to their projects (matrix view-only). Member: personal stats
- **Projects** — Admin + project admin (scoped). Collaborators on project detail
- **Team** — Admin: full CRUD. Project admin: view only
- **Project Managers** — Admin only: create PM logins
- **Tasks** — Admin/PM: manage within scope. Member: view own tasks only
- **Reports** — Role-scoped

## Project admin access (quick guide)

1. Super-admin creates a Project Manager with password.
2. PM signs in → sees Dashboard, Projects, Team, Tasks, Reports.
3. PM creates projects and invites other PMs as collaborators.
4. PM can view Team but cannot edit/delete members or the matrix.

## Design

- Colors: `app/globals.css` (integriti.io inspired)
- Layout rules: `docs/AppleDesign.md`
- Static labels: `data/` folder per page
- Dynamic data: API hooks in `hooks/` and `lib/`

## Project Structure

```
app/           — route pages (page.jsx only)
components/    — UI and page-specific components
data/          — static UI copy per page
hooks/         — data fetching hooks
lib/           — API client and utilities
```

## Reports

- Team Reports and Project Reports tabs (admin)
- Members: personal report view
- Filters: period, developer/project (admin), status, custom date range
- Export branded PDF via Export PDF button
