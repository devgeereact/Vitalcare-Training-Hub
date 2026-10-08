# Vitalcare Training Hub

The public website and training platform for Vitalcare Training Hub Ltd at vitalcare.uk: CSTF-aligned healthcare courses, lessons, assessments, certificates with public verification, sessions and attendance, cohorts, a store with invoices, payroll, mail and a forum.

`CLAUDE.md` is the detailed project record (architecture, roles, brand, coding standards, deployment). `AGENTS.md` is the shared agent contract.

## Stack

React 19, TypeScript, Vite, Tailwind CSS and shadcn/ui, with TanStack Query. Supabase provides authentication, Postgres with row-level security, storage and Edge Functions (`supabase/`).

## Setup

```bash
npm ci
cp .env.example .env.local   # then fill in the public Supabase URL and anon key only
npm run dev                  # http://localhost:5132
```

Only `VITE_*` values reach the browser. Every other secret lives in Supabase Edge Function settings, never in this repository.

## Checks

```bash
npm run verify       # typecheck, lint, secret scan and unit tests
npm run test:e2e     # Playwright
npx vite build       # build only
```

`npm run build` also regenerates `public/sitemap.xml` from the production database before building. `npm run test:security` needs live Supabase credentials.

## Branches and deployment

`production` is the live branch and the GitHub default. Work on `dev` or a `feature/*` branch and open a pull request. `npm run deploy` publishes `dist/` to vitalcare.uk; it is a production action. See `CLAUDE.md`, "Git and deployment", and `docs/SQL-EDITOR-RUNBOOK.md` for database changes.

## Licence

See `LICENSE.md`.
