# Pending database migrations: 092 and 093

Two migrations in `supabase/migrations/` are written, reviewed and committed but
**have not been applied**. Everything in this document is inert until they are.

They could not be applied from this workstation: the Supabase CLI account here
has no access to project `mongirnapzzizmzcrkqp`, and `supabase migration list
--linked` refuses with

```
Your account does not have the necessary privileges to access this endpoint.
```

Apply them from an account that administers the project.

> **Applying them by hand instead?** `docs/SQL-EDITOR-RUNBOOK.md` has the same
> two migrations laid out for the Supabase SQL Editor, with pre-flight checks,
> verification queries and rollback notes around them. Use that if you do not
> want to set up the CLI.

## What to run

```bash
cd ~/WebstormProjects/Vitalcare-Training-Hub
supabase login                    # as the account that owns the project
supabase link --project-ref mongirnapzzizmzcrkqp
supabase migration list --linked  # confirm 091 is the last applied
supabase db push                  # applies 092 and 093
```

Both migrations are idempotent and safe to re-run.

## 092_authorisation_and_integrity.sql

- **Organisation scoping.** `private.is_staff()` is global, so a trainer or an
  organisation administrator can currently read every learner's certificates,
  enrolments, attempts and attendance across every organisation. There is one
  organisation today, so this is a latent hole rather than a live breach, but it
  becomes a breach the day a second client is onboarded.
  `private.staff_for(user)` confines staff to their own organisation;
  `super_admin` still sees everything.
- **Policies declared `FOR ALL`** were granting `SELECT` as well, which would
  have defeated the scoped reads. Each is split into the write commands it was
  meant for.
- **Every profile gets an organisation**, including self-registered learners,
  which the scoping depends on. `handle_new_user` assigns the default one.
- **Unique indexes** on live certificates and enrolments, so concurrent writes
  cannot duplicate them.
- **`confirm_order`**, **`redeem_coupon_for_order`**: order confirmation and
  coupon counting move server-side and become idempotent. The old
  `redeem_coupon(text)` becomes a no-op, deliberately, so a browser holding an
  older bundle does not error.
- **`archive_course` / `restore_course` / `delete_course_permanently` /
  `course_deletion_impact`**: the course removal workflow. The UI already calls
  these and will report a clear failure until they exist.

## 093_assessment_and_expiry_guards.sql

- **Attempt guards.** `submit_assessment_attempt` enforces neither enrolment nor
  the attempt cap: the page blocks a learner at `max_attempts`, but the page is
  not the control. Calling the RPC directly lets anyone resit until they pass,
  or sit an assessment for a course they were never enrolled on.
- **Certificate expiry.** Issuance never set `expires_at`, so no certificate
  issued by completing a course has ever expired, and the daily expiry-alert job
  has had nothing to find. The function now reads `courses.renewal_months`, and
  the migration backfills existing certificates from their course.

## After applying

1. Re-run the authorisation suite with the gates on:

   ```bash
   MIGRATION_092_APPLIED=1 MIGRATION_093_APPLIED=1 npm run test:security
   ```

   That enables the organisation-scoping assertions, the attempt-cap and
   enrolment guards, and the concurrency suite, which are skipped until then. A
   skipped test is not a passing test.

2. Set the repository variables `MIGRATION_092_APPLIED` and
   `MIGRATION_093_APPLIED` to `1` so CI runs them too.

3. **Set `renewal_months` on the courses that need renewal.** No course has one
   today, so even after 093 nothing will expire. This is a business decision
   about each course's refresh period, typically 12 months for CSTF topics, and
   the migration cannot make it.
