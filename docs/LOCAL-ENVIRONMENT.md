# The isolated local environment

Everything that writes test data runs here, never against the live project.
The suites enforce that themselves: they refuse a target that is not on the
loopback address unless a run explicitly says otherwise.

## What you need

Docker running, and the Supabase CLI. Both are already installed on the
development machine.

## Standing it up

```bash
cd ~/WebstormProjects/Vitalcare-Training-Hub

# 1. Start the stack. Migrations are applied by hand in step 3, because
#    033_certificate_expiry.sql schedules a pg_cron job and the local image
#    does not enable that extension until asked.
mv supabase/migrations /tmp/vc-migrations && mkdir supabase/migrations
supabase start
rmdir supabase/migrations && mv /tmp/vc-migrations supabase/migrations

# 2. Enable pg_cron.
docker exec -i supabase_db_vitalcare-local \
  psql -U postgres -d postgres -c "create extension if not exists pg_cron;"

# 3. Apply every migration, in order, stopping at the first error.
for f in supabase/migrations/*.sql; do
  echo "== $f"
  docker exec -i supabase_db_vitalcare-local \
    psql -v ON_ERROR_STOP=1 -U postgres -d postgres -q -f - < "$f" || break
done
```

`supabase status` prints the local URL and keys. They are fixed development
values, identical on every machine, and grant nothing outside this computer.

## Seeding accounts

```bash
LOCAL_SUPABASE_URL=http://127.0.0.1:54321 \
LOCAL_SERVICE_ROLE_KEY=<the secret key from `supabase status`> \
LOCAL_TEST_PASSWORD=<any strong string> \
node scripts/seed-local-test-data.mjs
```

Six accounts, one per role, on the reserved `.test` domain, which cannot
receive real mail. The script refuses any target that is not on the loopback
address.

## Running the suites

**Authorisation, integrity and the learner journey**, against the database:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
VITE_SUPABASE_PUBLISHABLE_KEY=<local publishable key> \
TEST_SUPER_ADMIN_EMAIL=qa.superadmin@vitalcare.test \
TEST_SUPER_ADMIN_PASSWORD=$PW \
TEST_ADMIN_EMAIL=qa.admin@vitalcare.test        TEST_ADMIN_PASSWORD=$PW \
TEST_TRAINER_EMAIL=qa.trainer@vitalcare.test    TEST_TRAINER_PASSWORD=$PW \
TEST_LEARNER_EMAIL=qa.learner@vitalcare.test    TEST_LEARNER_PASSWORD=$PW \
TEST_OTHER_USER_EMAIL=qa.other@vitalcare.test   TEST_OTHER_USER_PASSWORD=$PW \
MIGRATION_092_APPLIED=1 MIGRATION_093_APPLIED=1 \
npm run test:security
```

Set both migration flags. Without them the organisation-scoping, attempt-cap
and concurrency assertions are skipped, and a skipped test is not a passing one.

**The operational rehearsal**, in a browser:

```bash
JOURNEY_SUPABASE_URL=http://127.0.0.1:54321 \
JOURNEY_SUPABASE_KEY=<local publishable key> \
JOURNEY_PASSWORD=$PW \
npx playwright test --config playwright.journey.config.ts
```

It builds the application against the local stack, serves it with
`vite preview` on port 5133, and drives it at desktop width and at 375px. The
config throws rather than starting if the target is not local.

**The public site**, which needs no database credentials:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
VITE_SUPABASE_PUBLISHABLE_KEY=<local publishable key> \
npx playwright test
```

Reading the mail the stack captured, in a browser: <http://127.0.0.1:54324>.

## Tearing it down

```bash
supabase stop            # keeps the data
supabase stop --no-backup   # discards it
```

## The one rule

Never point a fixture-writing suite at `mongirnapzzizmzcrkqp`. The guard in
`tests/security/helpers.ts` will stop you by accident; it cannot stop you on
purpose.
