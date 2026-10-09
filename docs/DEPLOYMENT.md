# Deployment plan

For the changes recorded in `docs/LAUNCH-READINESS.md`. Nothing here has been
run against production. It needs approval before any step is taken.

There is no auto-deploy. A push to `production` does not reach the live site:
the server has no Node, so the build runs locally and ships as static files.

## What is being deployed

| | |
|---|---|
| Database | Four new migrations, `094` to `097`. One amended file, `003_seed.sql`, which is already applied and will not re-run. |
| Application | Ordering, order status, the reset-password page, certificate verification, the two reporting workbooks, the compliance date rule, the `/platform/store/orders` route, the "My learning" list, and the tab order on the sign-in form. |
| Configuration | `PAYMENT` and `VAT` blocks in `src/lib/constants.ts`, both needing real values first. |

## Before anything

1. **Resolve `docs/LAUNCH-READINESS.md` §2.2.** Confirm whether 092 and 093 are
   applied. `094` depends on `private.is_staff()` and
   `redeem_coupon_for_order`, both introduced by 092. Applying 094 to a
   database without 092 will fail on the first reference, harmlessly, but do
   not find that out in production.
2. **Take a backup you have restored.** See §2.6 of the readiness record. A
   Supabase automated backup that has never been restored is not a rollback
   plan.
3. **Fill in the payment details** (§2.4). Deploying with them empty is safe:
   the screen says the details will be emailed. It is just slower for staff.
4. **Confirm CI is green** on the branch being deployed: secret scan, typecheck,
   lint, build, unit tests.

## Migration order

Apply in this order, one at a time, reading each result:

```
092_authorisation_and_integrity.sql     (if §2.2 shows it is not applied)
093_assessment_and_expiry_guards.sql    (if §2.2 shows it is not applied)
094_order_integrity.sql
095_certificate_verification_states.sql
096_enrolled_course_visibility.sql
097_completion_certificate_expiry.sql
```

Either `supabase db push` from an account that administers the project, or the
SQL Editor. All four are idempotent: running one twice does nothing the second
time.

**One caveat in 095.** It drops and recreates `verify_certificate(text)`,
because the function gains a return column and `create or replace` cannot
change a return type. Between the drop and the create, public verification
returns an error for a fraction of a second. Run it outside business hours if
that matters.

**094 changes two row-level security policies.** `orders_insert` and
`order_items_insert` become staff-only: buyers order through `place_order`
instead. Deploy the application at the same time, or a browser holding the old
bundle will get a policy violation when it tries to place an order. Deploying
the database first and the application within the same window is the right
order, because the old bundle failing loudly is better than the new bundle
finding no function.

### Verify each one

```sql
-- After 094
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname in ('place_order', 'set_order_status');
-- expect two rows

select polname, polcmd from pg_policy
where polrelid = 'public.orders'::regclass order by polname;
-- expect orders_insert to exist, with a staff check

-- After 095
select state from public.verify_certificate('VC-ZZZZZZ');
-- expect no rows, and no error

-- After 096
select pg_get_expr(polqual, polrelid) from pg_policy
where polrelid = 'public.courses'::regclass and polcmd = 'r';
-- expect the expression to mention public.enrollments

-- After 097
select pg_get_functiondef(oid) ilike '%expires_at%'
from pg_proc where proname = 'sync_course_completion';
-- expect true
```

**097 does not backfill.** Certificates already issued without an expiry stay
as they are, on purpose: giving one an expiry can make it lapse the instant the
statement runs, and the daily alert job emails its holder the next morning.
`SQL-EDITOR-RUNBOOK.md` has that backfill with a pre-flight query showing
exactly who it would affect. Run it separately, having looked, and tell the
affected people first.

## Deploying the application

```bash
npm run verify        # typecheck, lint, secret scan, unit tests
npm run deploy:check  # dry run: prints every file rsync would change
npm run deploy        # build, then rsync to vitalcare.uk
```

`npm run build` regenerates `public/sitemap.xml` from the database. Build with
`.env.local` in place, pointing at the live project, or the sitemap comes out
containing only the static routes and the deploy ships that. If you have been
building against the local stack, check `git diff public/sitemap.xml` before
deploying.

Run `deploy:check` first and read it. `vitalcare.uk` is an addon-domain root
and the deploy mirrors: anything on the server that is absent locally is
deleted. `public/.htaccess` owns SPA routing and is only shipped when the
deploy passes `--with-htaccess`, which the npm scripts do.

## Post-deployment verification

In this order, on the live site:

1. **Public pages.** Load `/`, `/our-courses`, `/contact-us`. Then a deep link
   straight into the address bar, `/resources/verify-certificate`, to prove the
   SPA rewrite survived. Then a URL under `/assets/` that does not exist: it
   must return 404, not an HTML page with status 200, or `chunk-reload.ts`
   cannot tell a stale bundle from a missing one.
2. **Verification.** Enter a known-good certificate code and confirm it reads
   "Valid certificate". Enter `VC-ZZZZZZ` and confirm "No matching
   certificate".
3. **Account access.** Register one controlled account, receive the
   confirmation email, follow it, sign in, sign out, request a password reset,
   complete it. Record the date and the account: this closes §2.3.
4. **A booking, end to end.** Place one order as a controlled learner account.
   Confirm the reference appears on screen in the form `VC-YYMM-NNNN`, that the
   amount matches the catalogue, and that the payment instructions are the
   approved ones. Confirm it as staff and check the enrolment appears. Then
   cancel a second test order.
5. **Reports.** Export the live Business Overview and the live Finance Tracker.
   Check that the KPI sheet states its period, that Clients and Forecast are
   named "(blank template)", and that Invoiced and Received are separate
   columns.
6. **Compliance dates.** Open the compliance matrix and check one staff member
   whose completion date is a month end. The due date must clamp, not overflow.

Then delete the test records you created.

## Rollback

| What went wrong | What to do |
|---|---|
| The application is broken but the database is fine | Rebuild from the previous commit and `npm run deploy` again. The static site has no state. |
| `094` is applied but the application deploy failed | Buyers cannot place orders until the application lands, because the browser can no longer insert directly. Either finish the application deploy, or restore the previous `orders_insert` and `order_items_insert` policies from `supabase/migrations/016_store.sql`. |
| `095` broke public verification | Re-apply the `verify_certificate(text)` definition from `083_certificate_approval.sql`. The page tolerates the missing `state` column badly, so restore the application to its previous commit at the same time. |
| `096` or `097` needs reverting | Re-apply the previous definitions: `courses_read` from `002_rls.sql` and `sync_course_completion` from `091_course_completion_server_side.sql`. Reverting `096` hides unpublished courses from the learners enrolled on them again, which is the defect, so prefer fixing forward. |
| Data damage | Restore from the backup taken before the deployment. This is the step nobody has rehearsed: see §2.6. |

None of these migrations drops a table, a column or a row, and none writes to
an existing one. `094` adds a sequence, an index and three functions, and
narrows two insert policies. `095` replaces one function. `096` widens one
select policy. `097` replaces one function. All are reversible by re-applying
the previous definitions, which are in the repository.

## Not covered here

Rotating the published super_admin password (§2.1), SMTP configuration (§2.3)
and the backup rehearsal (§2.6) are prerequisites, not deployment steps. Do
them first.
