# Vitalcare-Training-Hub Agent Contract

This existing project adopts the active shared GEE OS, minimum version 0.9.0. Read `.agent/PROJECT.yml` and `.agent/CURRENT-TASK.md`, then apply the constitution, loop and routing rules at `~/.agents/gee-os`.

## Read order

1. `AGENTS.md`, this shared entry point.
2. `.agent/PROJECT.yml`, project routing and risk.
3. `.agent/CURRENT-TASK.md`, current scope and evidence.
4. `CLAUDE.md`, preserved project knowledge pending modularisation.
5. `README.md` and the relevant files under `docs/`.

## Commands

- Install: `npm ci`
- Develop: `npm run dev` (port 5132)
- Verify: `npm run verify` (typecheck, lint, `check:secrets`, unit tests)
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Test: `npm test` (unit); `npm run test:security` needs live Supabase credentials; `npm run test:e2e` runs Playwright
- Build: `npm run build` (also rewrites `public/sitemap.xml` from the production database); `npx vite build` for a build-only check
- Deploy: `npm run deploy` publishes to vitalcare.uk. Production action, needs explicit approval.

## Shared rules

- Select one primary mode and load only relevant systems, workflows, skills and MCP rules.
- Preserve established business rules, architecture and user work.
- Treat documentation as evidence to verify against real code and behaviour.
- Apply the change safety protocol before modifying existing behaviour.
- Never claim fixed, secure, accessible or ready without matching evidence.
- Keep remote and production changes outside scope unless the current user authorises them explicitly.
- MCP and skill availability never expands user authority.

## Migration note

The existing `CLAUDE.md` remains intact during the first adoption wave. Its content will be classified and moved only after a project-specific review identifies the correct source of truth for each fact.
