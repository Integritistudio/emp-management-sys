# Management System Frontend

Integriti Employee Management System — Next.js frontend.

## Setup

1. Copy `.env.local.example` to `.env.local` (or create with `NEXT_PUBLIC_API_URL=http://localhost:5000/api`)
2. Run `npm install`
3. Run `npm run dev` → http://localhost:3000 (or next available port)
4. Ensure the backend is running at `http://localhost:5000`

## Features

- **Login** — Admin or team member (email + password, JWT cookie)
- **Change Password** — Sidebar action; requires current password
- **Dashboard** — Admin: org analytics, team performance, matrix. Member: personal stats only
- **Projects** — Admin only: full CRUD, filters, detail page with task sub-table
- **Team** — Admin only: card grid, add/edit members, set/reset login password (`has_login` badge)
- **Tasks** — Admin: all tasks + bulk. Member: own tasks only; can add tasks assigned to self
- **Reports** — Admin: team & project tabs. Member: own report only. PDF export

## Member access (quick guide)

1. Admin creates/edits a team member and sets a login password.
2. Member signs in with that email and password.
3. Member sees Dashboard, Task Management, and Reports only.
4. Member can change their password from the sidebar.

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
