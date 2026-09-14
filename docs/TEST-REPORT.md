# Test report

14 September 2026. Local revision `0619b92` plus the changes recorded in
`docs/LAUNCH-READINESS.md`.

Every figure below is a count this machine produced. Skips are listed as skips.

## Environment

| | |
|---|---|
| Application | `/Users/mrgee/WebstormProjects/Vitalcare-Training-Hub`, branch `dev` |
| Database under test | Isolated local Supabase stack (`supabase start`), PostgreSQL 17.6.1, project id `vitalcare-local` |
| Accounts | Six synthetic accounts on the reserved `.test` domain, created by `scripts/seed-local-test-data.mjs`. Password generated for this run, never committed. |
| Mail | The stack's own SMTP sink. No message could reach a real address. |
| Payments | No processor exists. No real money could move. |
| Live project | **Not accessed.** The Supabase account available here administers a different organisation; `list_migrations` on `mongirnapzzizmzcrkqp` returned "You do not have permission to perform this action". |

All 91 committed migrations, plus `094` and `095` added here, applied in order
against an empty database with no errors. `pg_cron` had to be created first:
migration `033` schedules a job and the local image does not enable the
extension by default. That is a local-environment step, not a defect.

## Round A: baseline, before any change

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors, 3 warnings |
| `npm run test` (unit) | PASS, 52 tests in 7 files |
| `npm run check:secrets` | PASS, 588 tracked files scanned |
| `npx vite-node scripts/verify-workbooks.mjs` | PASS, 40 assertions |
| `npm run test:security` | Previously **not run**: no confirmed isolated target |

The three lint warnings are pre-existing and unrelated: TanStack Table
memoisation in `src/components/data-table.tsx`, an unused `ref` in the vendored
`src/components/ui/sidebar.tsx`, and an unused `page` parameter in
`tests/e2e/performance.spec.ts`. They were left alone.

`node scripts/verify-workbooks.mjs` fails with `ERR_MODULE_NOT_FOUND`: the
builders import without file extensions, so it needs `vite-node`. Noted so the
next person does not read it as a broken verifier.

## Round B: after the corrections

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors, 3 warnings (the same three) |
| `npm run test` (unit) | PASS, **85** tests in 8 files (52 before, plus 30 date assertions and 3 auth-message assertions) |
| `npm run build` | PASS. Warns that `vendor-spreadsheet` is 1.37 MB; it is lazily imported. |
| `npx vite-node scripts/verify-workbooks.mjs` | PASS, 47 assertions |
| `npm run check:secrets` | PASS |

### Authorisation and integrity, against the isolated database

Run with `MIGRATION_092_APPLIED=1` and `MIGRATION_093_APPLIED=1`, so the
organisation-scoping, attempt-cap, enrolment-guard and concurrency assertions
were **enabled**, not skipped.

```
Test Files  7 passed (7)
     Tests  95 passed | 7 skipped (102)
```

| Suite | Passed | Skipped |
|---|---|---|
| `certificate-access.test.ts` | 8 | 1 |
| `certificate-verification.test.ts` (new) | 7 | 1 |
| `concurrency.test.ts` | 4 | 1 |
| `data-isolation.test.ts` | 27 | 1 |
| `feature-coverage.test.ts` | 17 | 1 |
| `learner-journey.test.ts` | 13 | 1 |
| `order-integrity.test.ts` (new) | 19 | 1 |

The seven skips are one per file: each suite carries an inverted `describe` that
runs only when credentials are absent, and asserts that a skip is not a pass.
No business assertion was skipped.

**One transient failure.** On the first full-suite run,
`certificate-verification.test.ts` reported "An invalid response was received
from the upstream server", a 502 from the local API gateway under load. The same
test then passed three consecutive times in isolation, and the full suite passed
on re-run. Recorded as a local-stack flake.

**One fixture collision, fixed.** An early draft of the password-reset
rehearsal changed a shared account's password, after which the authorisation
suite could not sign in as that role. The rehearsal now registers its own
throwaway account for each reset case. Both suites were then run in sequence,
authorisation first, and both passed.

### Operational rehearsal, in a browser

`playwright.journey.config.ts`, against a production build pointed at the
isolated stack.

```
34 passed (1.4m)   # 17 assertions at desktop width, the same 17 at 375px
```

Covering: registration, confirmation email followed to the platform, sign-in,
sign-out, a wrong password, a complete password reset, the old password ceasing
to work, an expired reset link, a reset link with nothing in it, the platform
guard against anonymous visitors, publishing a product, ordering it, the
reference and amount shown, the buyer seeing their own pending order, staff
confirming payment and the buyer being enrolled, a confirmed order offering a
refund rather than a second confirmation, cancelling an unpaid order, and three
public certificate-verification cases.

### Public site

`playwright.config.ts`, production build, Chromium at six widths, pointed at
the isolated stack rather than the live project.

```
330 passed | 6 skipped (1.1m)
```

The six skips are the deployment-only missing-asset check, one per browser
project. It exercises Apache's behaviour and cannot run locally. That remains
**not tested**.

## What remains untested

| | Why |
|---|---|
| The live database's migration state | No authorised access from this session. The exact read-only queries to run are in `docs/LAUNCH-READINESS.md` §2.2. |
| Live registration, confirmation email and password reset | Needs the live project and a controlled account. The application's side is proved; the provider's is not. |
| Real payments and refunds | No processor exists. The manual process was exercised end to end with synthetic orders. |
| Backup and restore | Never rehearsed. |
| The deployed site's deep links and missing-asset handling | Requires Apache. |
| Safari and Firefox | The suites run Chromium only. |
| Course completion through the browser | Proved at the API level by `learner-journey.test.ts`. A browser rehearsal of lessons and assessment was not built. |
| Accreditation claims, CPD hours and course content | Not something a test can establish. |

## Reproducing this

See `docs/LOCAL-ENVIRONMENT.md`.
