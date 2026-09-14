# Launch readiness

**Status: not ready for a controlled pilot.** Six items block it, all of them
outside this repository: live database state, email configuration, payment
details, clinical approval, backup rehearsal and a named support rota.

Everything that could be fixed and proved locally has been. The application
code, the database migrations and the test suites are in a state where the
remaining work is configuration and decisions, not development.

Last updated 14 September 2026, against local revision `0619b92` plus the
changes described here. This is the single current readiness record. Earlier
documents are historical and are labelled as such.

---

## How to read this

Each item says what was found, who has to act, and what evidence exists. A
claim is only marked **verified** when a named test in this repository proves
it. **Not tested** means exactly that.

| Priority | Meaning |
|---|---|
| Blocker | The pilot cannot open until this is resolved. |
| Before full launch | The pilot can run; this must be closed before wider sales. |
| Watch | Known, accepted for now, revisit. |

---

## 1. Fixed and verified in this repository

These were defects. They are corrected, and each has a test that fails if the
defect returns.

| Issue | Consequence if unfixed | Correction | Evidence |
|---|---|---|---|
| Renewal dates overflowed the month. 31 January plus one month gave 3 March; 29 February plus twelve months gave 1 March. | Compliance dates, certificate expiry and renewal reminders disagreed with the database, which clamps. Staff would be told a refresher was due on a date that does not exist in that month. | `src/lib/dates.ts` adds `addCalendarMonths`, matching PostgreSQL. `complianceStatus` uses it, and compares whole days from midnight rather than from the current time. | `tests/unit/compliance-dates.test.ts`, 30 assertions, including both reported cases, month ends, leap years, the 30-day boundary and Europe/London during British Summer Time. |
| The compliance matrix applied each course's *current* renewal period to *historical* records, ignoring the period saved against the record. | Editing a course silently moved every past due date for that course, contrary to the snapshot the specification describes. | `getStaffMatrix` now reads `staff_training_records.renewal_months` and prefers it, falling back to the course only for older rows that predate the column. | `src/lib/queries/compliance.queries.ts`. Covered indirectly by the matrix export assertions in `scripts/verify-workbooks.mjs`. |
| An order's price came from the browser. `orders_insert` only checked the buyer's identity, so any signed-in person could post a £495 course as a £0 order with an invented coupon code. | Staff would see an ordinary-looking order at the wrong price and confirm it, enrolling someone who had not paid. | Migration `094_order_integrity.sql` adds `place_order`, which prices from the catalogue, re-checks the coupon under a row lock, and writes the order and its item in one transaction. Direct inserts are now staff-only. | `tests/security/order-integrity.test.ts`, 19 assertions against a real database. |
| The order and its item were two separate writes and the second one's error was never read. | "Order placed" could be reported for an order containing nothing, which confirmation then could not enrol. | Both writes happen inside `place_order`. | Same suite: "writes the order and its item together". |
| Orders had a reference the buyer was never shown. The confirmation screen asked them to "reference your name". | A bank payment could not be matched to an order. | `place_order` issues `VC-YYMM-NNNN` from a sequence, the mutation returns it, and the confirmation screen shows it with the amount, the payment route and the expected confirmation time. | `tests/journey/booking.spec.ts`, and the unique-reference assertion in the order suite. |
| Staff could confirm a cancelled or refunded order, and there was no way to cancel or refund at all. | A withdrawn booking stayed "pending payment" for ever, or was confirmed into an enrolment nobody was paying for. | `confirm_order` now accepts only a pending order. `set_order_status` allows pending to cancelled and paid to refunded, audits both, and returns a cancelled order's coupon use. | Order suite: cancelled-then-confirmed, unpaid-refund, repeated cancel, coupon release. |
| Confirming an order always said "Payment confirmed, buyer enrolled", even when the server had refused. | A double booking or a re-confirmation looked successful. | The mutation returns the server's answer and the page reports a refusal. | `tests/journey/booking.spec.ts`: a confirmed order offers a refund, not another confirmation. |
| A learner was told to "track the status under Store, Orders", on a page restricted to management. They were bounced to the dashboard. | A buyer had no way to see whether their payment had been confirmed. | The route and the sidebar entry are open to any signed-in person. The page already showed staff every order and a buyer only their own, and row-level security enforces it. | `tests/journey/booking.spec.ts`: the learner can see the order sitting unpaid, under that reference. |
| The reset-password page showed its form to everybody, including someone on an expired link. Submitting it failed with "Something went wrong. Please try again." | Somebody locked out of their account was sent round a loop with no indication that the link, not the password, was the problem. | The page waits for a recovery session, reads the error Supabase puts in the address bar, and shows an expired or unusable state with a link to request a new one. It signs the recovery session out after the change. | `tests/journey/account-access.spec.ts`: full reset, old password stops working, expired link, empty link. |
| Public verification reported an unapproved certificate as "Genuine, but no longer in date", and published the learner's name with it. | The company publicly vouched for a certificate it had not issued, naming a person who had not earned it. | Migration `095_certificate_verification_states.sql` returns a state of valid, expired or not issued, and withholds every personal field for one that was never issued. All three verification screens distinguish the states. | `tests/security/certificate-verification.test.ts`, 7 assertions, including the withheld fields and a withdrawn certificate. |
| The Business Overview workbook counted every learner account as "Learners Trained" and every session as "Courses Delivered", cancelled and future ones included, under a heading of "Year to date" with no date filter anywhere. | Three headline figures overstated the business, in a workbook people file. | `useBusinessMeasures` produces dated measures. The workbook reports one row per measure with the rule that produced it, keeps delivered, cancelled and future sessions apart, and keeps invoiced separate from received. | `scripts/verify-workbooks.mjs`, seven new assertions. |
| The Finance Tracker added VAT at 20% to every line and to the total. Every unpaid invoice, including voided ones, read "Pending". | A voided invoice looked like a debt, and a tax figure nobody had approved was presented as fact. | VAT columns appear only when `VAT.registered` is true in `src/lib/constants.ts`, at the rate recorded there, with the rate in the column heading. Invoiced and Received are separate columns with separate totals. Statuses are Paid, Sent, Draft and Void. | `scripts/verify-workbooks.mjs`, both arms of the VAT rule. |
| Sheets with no data source rendered exactly like populated ones. | A styled empty sheet inside a workbook labelled "live export" reads as a real answer of zero. | Clients, Forecast, Expenses and Dashboard tabs are named "(blank template)". | `scripts/verify-workbooks.mjs`: blank sheets are named as templates. |
| Migration `003_seed.sql` created a `super_admin` account with its password written in plain text, in a public repository. | Anyone who read the file knew a super_admin password for every environment the migration had been applied to. | The account creation is removed; the role promotion by email remains. Local environments use `scripts/seed-local-test-data.mjs`. | See item 2.1 below: **removing it does not unpublish it.** |
| The fixture-writing test suites would run against whatever `VITE_SUPABASE_URL` pointed at. | A mistyped environment file writes courses, orders and certificates into the live register. | The suites refuse any target that is not on the loopback address unless `SECURITY_SUITE_TARGET_CONFIRMED=1` is set for that run. CI sets it deliberately. | `tests/security/helpers.ts`. |

---

## 2. Blockers: decisions and configuration outside this repository

### 2.1 Rotate the published super_admin password — **Blocker**

**Owner: Gideon.**

`supabase/migrations/003_seed.sql` created `gideon@vitalcare.uk` with a
hard-coded password. The file is in a public repository and the password is in
its Git history, so it is public whether or not the account still uses it.
`CLAUDE.md` already carries a warning that test-account passwords were
published and must be rotated; this is a second, separate instance.

**Action:** rotate that account's password in Supabase Auth, and rotate every
test account with `scripts/rotate-test-passwords.mjs`. Then update the
repository secrets. Nothing else in this record matters until an unknown reader
cannot sign in as a super_admin.

**Not tested:** whether the live account's password has already been changed.

### 2.2 Confirm what is actually applied to the live database — **Blocker**

**Owner: Gideon, or whoever administers project `mongirnapzzizmzcrkqp`.**

The two documents disagree, and both are historical:

- `docs/DEPLOYMENT-092-093.md` says migrations 092 and 093 are **not applied**,
  and that **no course has a renewal period**.
- `docs/SQL-EDITOR-RUNBOOK.md`, under "What was actually applied, 24 August
  2026", says step 5 has been run and **29 courses carry a renewal period**, 14
  at 12 months and 15 at 36. Step 5 comes after applying 092 and 093, so that
  note implies both were applied on or before that date.

The later dated note is the better evidence, but neither is proof. This session
had no authorised access to that project: the Supabase account available here
administers a different organisation, and `list_migrations` returned "You do not
have permission to perform this action".

**Do not re-run anything on the strength of the older document.** Run these
read-only queries in the SQL Editor and record the answers here:

```sql
-- 1. What the migration table believes.
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 6;

-- 2. What actually exists, which is what matters.
select proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and proname in ('staff_for', 'confirm_order', 'redeem_coupon_for_order',
                  'submit_assessment_attempt', 'issue_course_certificate',
                  'archive_course', 'place_order', 'set_order_status')
order by 1;

-- 3. Renewal periods: the business decision behind expiry.
select coalesce(renewal_months::text, 'none') as renewal_months,
       count(*)
from public.courses
where deleted_at is null
group by 1 order by 1;

-- 4. Certificates that would be affected by any expiry backfill.
select count(*) filter (where expires_at is null) as no_expiry,
       count(*) filter (where expires_at is not null) as with_expiry
from public.learner_certificates
where deleted_at is null;
```

All 91 existing migrations, plus the two added here, apply cleanly in order
against an empty PostgreSQL 17 database. That is proved locally and says
nothing about the live one.

### 2.3 Confirm that account email actually sends — **Blocker**

**Owner: Gideon.**

`docs/SQL-EDITOR-RUNBOOK.md` ends with an undated note that registration
returns "Error sending confirmation email" because Supabase Auth has no SMTP
provider on that project. That was not reproduced here and is treated as
historical, not as a current outage.

What is now proved is that the application's side of the flow works. Against an
isolated local stack with confirmations enabled, a new account registers,
receives a confirmation email, follows the link and reaches the platform;
password recovery runs from request to a working new password; and the old
password stops working. Seventeen browser assertions, twice, at desktop width
and at 375px.

**Action:** configure a custom SMTP provider in Supabase (Project Settings,
Authentication, SMTP Settings) if one is not configured, then register one
controlled account on the live project and reset its password. Record the date
and the account. Distinguish an application defect from a provider setting: the
application is no longer the unknown here.

Also confirm the live Auth redirect allow-list contains the production
`/auth/callback` and `/reset-password` URLs.

### 2.4 Approve the payment destination — **Blocker**

**Owner: Gideon, with whoever owns the bank account.**

`src/lib/constants.ts` has a `PAYMENT` block with the bank and PayPal fields
deliberately empty. While they are empty the confirmation screen says "We will
email the details to you, quoting this reference", which is honest but slower.
No account number has been invented.

**Action:** fill in `bankAccountName`, `bankSortCode`, `bankAccountNumber` and
`paypalAddress` from details the account holder has approved, and confirm
`confirmationWindow` ("one working day") is a promise the team can keep.

Note the PayPal position: the store offers PayPal as a *label*. There is no
PayPal integration and no automated checkout. Do not advertise one.

### 2.5 Approve the launch courses and their renewal rules — **Blocker**

**Owner: Harni Muharami RN MSc, Clinical Director.**

For each course in the pilot, one approved record: audience, learning outcomes,
delivery method, duration, assessment and pass requirements, trainer,
capacity, certificate wording and renewal period.

Two specific open questions:

- **The Care Certificate is currently set to 12 months.** The runbook proposes
  leaving it with no expiry, on the grounds that it is an induction standard
  achieved once. It was left as previously set rather than silently reversed.
  Decide which.
- **Renewal periods are course-level decisions.** Skills for Health states that
  refresher frequency is a requirement of CSTF alignment, so a blanket "annual
  or three-yearly" grouping is not course-level approval.

Nothing in this repository invents a renewal period, a pass mark or an
accreditation claim, and nothing here should.

### 2.6 Rehearse a restore, and name the support cover — **Blocker**

**Owner: Gideon.**

Supabase takes automated backups on the free plan, retained for a short window.
Neither the retention period nor a restore has been confirmed for this project,
and no restore has been rehearsed. A backup that has never been restored is a
belief, not a recovery plan.

**Action:** confirm the retention window, take a manual export of the tables
that carry the business record (`profiles`, `enrollments`,
`learner_certificates`, `orders`, `order_items`, `invoices`,
`staff_training_records`, `attendance_records`), store it somewhere outside
Supabase, and rehearse restoring it into a scratch project. Then name a support
contact and a named backup for the pilot window.

---

## 3. Before full launch

| Issue | Owner | Action |
|---|---|---|
| CI writes test fixtures into whichever project the repository secrets name. The suites create courses, orders, attempts and certificates. | Gideon | Point CI at a dedicated staging project, or run a local `supabase start` stack inside the job. Until then, expect QA fixture rows in the live register. |
| The repository variables `MIGRATION_092_APPLIED` and `MIGRATION_093_APPLIED` gate the organisation-scoping, attempt-cap and concurrency assertions. If they are not `1`, CI warns and skips them. | Gideon | Set both to `1` once 2.2 confirms the migrations are applied. A skipped test is not a passing one. |
| Consumer cancellation and refund wording. The refund page makes first access the trigger for losing the right to cancel; the consent flow that requires was not established. | Gideon, with advice | Check the Consumer Contracts Regulations position before consumer (as opposed to employer) sales. |
| Retention periods. "Seven years" is treated in places as a universal rule. It is not. | Gideon | Record a purpose and a period per data category in `docs/PRIVACY-DATA-MAP.md`. |
| VAT registration and treatment. `VAT.registered` is `false`, so reports show no VAT at all. | Accountant | Confirm registration status and the rate that applies to training services, then set `VAT.registered`, `ratePercent` and `registrationNumber`. |
| No Safari or Firefox coverage. The browser suites run Chromium only. | Technical owner | `npx playwright install webkit` and add a project, or accept and state the limitation. |
| Certificate verification codes are six characters from a 32-character alphabet, roughly a billion combinations, behind an unthrottled public function. | Technical owner | Acceptable at pilot volume. Add rate limiting before the code is printed on certificates at scale. |

---

## 4. Watch

- The store's coupon quote in the browser is a preview. The server decides. If
  a coupon lapses between the two, the order is placed at the full price and
  the buyer is told. That is correct, and worth watching for confusion.
- `useAnalyticsSummary` still counts totals, which is right for the dashboard
  it feeds. Only the workbook moved to dated measures. Do not put
  `summary.learners` under a heading containing "trained".
- One transient failure was seen during a full-suite run: a 502 from the local
  stack's API gateway under load, in `certificate-verification.test.ts`. The
  same test passed three times immediately afterwards and the full suite passed
  on re-run. Recorded as a local flake, not an application defect.
- The spreadsheet vendor chunk is 1.37 MB. The build warns. No user-visible
  problem; it is lazily imported.

---

## 5. Acceptance conditions

From the launch proposal, with what is now evidenced against each.

| Condition | Status | Evidence |
|---|---|---|
| People can get in | **Application verified. Live configuration not tested.** | 17 browser assertions against an isolated stack, desktop and 375px. Live SMTP unconfirmed: see 2.3. |
| Money and access agree | **Application verified. Payment details not approved.** | 19 database assertions and 6 browser assertions covering pricing, atomicity, duplicate confirmation, cancellation, refund and coupon integrity. See 2.4. |
| Learners can finish | **Verified at the API level. Browser rehearsal of course completion not built.** | `tests/security/learner-journey.test.ts`: enrol, learn, fail, retry, pass, certificate, one certificate only. |
| Records are protected | **Verified against a database with 092 and 093 applied.** | 95 assertions across six suites with both migration gates on. Live migration state unconfirmed: see 2.2. |
| Training evidence is correct | **Dates verified. Clinical approval outstanding.** | 30 date assertions; certificate verification states proved. See 2.5. |
| Operations can recover | **Not tested.** | See 2.6. |

**Verdict: not ready.** Close 2.1 through 2.6 and the pilot can open. None of
them requires further development.

---

## 6. What was run, and what it said

See `docs/TEST-REPORT.md` for exact pass, fail and skip counts.
