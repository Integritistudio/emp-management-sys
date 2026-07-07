# Apple Design Guidelines — Integriti EMS

UI layout rules for the Employee Management System.  
**Branding colors** are defined in `app/globals.css` (sourced from [integriti.io](https://www.integriti.io/)).

## Layout Principles

- Generous whitespace — use 8px spacing grid (8, 16, 24, 32, 48)
- Content-first — minimal chrome, clear hierarchy
- Cards: `rounded-card`, `shadow-card`, white surface on light background
- Tables: sheet-style, clean borders, readable row height

## Typography

| Level | Usage |
|---|---|
| Page title | `text-2xl font-semibold text-text-primary` |
| Section title | `text-lg font-medium text-text-primary` |
| Body | `text-sm text-text-primary` |
| Caption / label | `text-xs text-text-secondary` |

## Interactions

- Transitions: 150–200ms ease on hover/focus states
- Buttons: rounded-button, clear primary/secondary variants
- Focus rings: `ring-2 ring-primary/30 ring-offset-2`

## Loading States

- Prefer **skeleton** placeholders over spinners for data sections
- Use **ButtonLoader** inline on form submit only
- Never show blank content while fetching — always skeleton first

## Components

- Component-specific styles live in component Tailwind classes
- Do not add component CSS to `globals.css`
- Reuse `components/ui/` primitives across all pages
