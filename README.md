# Vitalcare Training Hub

CSTF-aligned, CPD-accredited healthcare training, and the platform that runs
it. One Vite + React application serves both: the public site at `vitalcare.uk`
and the authenticated training management system at `vitalcare.uk/platform`.

Vitalcare Training Hub Ltd, company number 15718997, England and Wales.

## Where to start

| If you want to | Read |
|---|---|
| Know what is blocking launch | [`docs/LAUNCH-READINESS.md`](docs/LAUNCH-READINESS.md) |
| Know what has been tested | [`docs/TEST-REPORT.md`](docs/TEST-REPORT.md) |
| Run the day-to-day process | [`docs/OPERATING-GUIDE.md`](docs/OPERATING-GUIDE.md) |
| Set up a safe test database | [`docs/LOCAL-ENVIRONMENT.md`](docs/LOCAL-ENVIRONMENT.md) |
| Deploy | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) |
| Work on the code | [`CLAUDE.md`](CLAUDE.md) |

## The stack

Vite 7, React 19 and TypeScript in strict mode, routed by React Router v7.
Tailwind and shadcn/ui for the interface, TanStack Query for server state and
Zustand for client state, React Hook Form with Zod on every form. Supabase
provides authentication, PostgreSQL with row-level security, storage and edge
functions. Certificates are drawn with jsPDF; workbook exports use ExcelJS.

It is a single-page application. There is no server-side rendering, and the
hosting is static: the build runs locally and ships to cPanel over rsync.

The interface was forked from the `pulse-ui-react` template and rebranded.
Components under `src/components/ui/` come from shadcn and are not edited.

## Running it

```bash
npm ci
npm run dev
```

That points at the live Supabase project through `.env.local`, which is not in
the repository. For anything that writes data, stand up the isolated local
stack instead: [`docs/LOCAL-ENVIRONMENT.md`](docs/LOCAL-ENVIRONMENT.md).

```bash
npm run verify    # typecheck, lint, secret scan, unit tests
npm run build
```

## Branches

`production` is the default branch and the one the live site is built from.
`dev` is where work happens; feature branches open pull requests into it.
Deployment is manual: see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## A note on credentials

This repository is public. Two passwords have been published in it in the past,
one of them for a `super_admin` account on the live project. They are in the
Git history and cannot be unpublished. If they have not been rotated, rotate
them: see `docs/LAUNCH-READINESS.md` §2.1.

Real keys live in `.env.local` and `.env.test.local`, both git-ignored, and in
repository secrets. `npm run check:secrets` runs on every commit and in CI.

## Licence

See [`LICENSE.md`](LICENSE.md).
