# Management System Frontend

Integriti Employee Management System — Next.js frontend.

## Setup

1. Copy `.env.local.example` to `.env.local` (or create with `NEXT_PUBLIC_API_URL=http://localhost:5000/api`)
2. Run `npm install`
3. Run `npm run dev` → http://localhost:3000 (or next available port)
4. Ensure the backend is running at `http://localhost:5000`

## Features

- **Login** — PostgreSQL admin auth with JWT cookie
- **Dashboard** — analytics cards, team performance, weekday breakdown, 3×3 matrix
- **Projects** — full CRUD, filters, detail page with task sub-table
- **Team** — card grid, add/edit members, live stats
- **Tasks** — CRUD, timer pause/resume/complete, bulk actions, visual alerts
- **Reports** — team & project tabs, 6 Recharts chart types, PDF export

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

- Team Reports and Project Reports tabs
- Filters: period, developer/project, status, custom date range
- Export branded PDF via Export PDF button
