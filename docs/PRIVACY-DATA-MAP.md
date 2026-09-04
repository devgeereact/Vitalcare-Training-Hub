# Privacy data map

Written 4 September 2026 from the code, the migrations and a runtime inspection
of the production build. It is evidence for the Privacy Policy and the Cookie
Policy, and the place to update first when either of them changes.

Nothing here is legal advice. Retention periods, lawful bases and transfer
safeguards are business and legal facts, not code facts, and every one of them
is marked below with who has to confirm it.

Controller: Vitalcare Training Hub Ltd, company number 15718997, 11 Halesworth
Road, London SE13 7TJ. Contact info@vitalcare.uk, 020 8059 8757.

## How this was checked

| Method | Covers |
|---|---|
| `supabase/migrations/*.sql`, 91 files | Tables, columns, row-level security |
| `supabase/functions/*`, 23 functions | Server-side vendors and secrets |
| `src/**` static read | Forms, browser storage, third-party URLs |
| `tests/e2e/privacy.spec.ts` against the production build | Real cookies, real browser storage, real network log |

The e2e suite is the part that stays true on its own: it fails when a new
cookie, a new stored key or a new third-party host appears.

## Data inventory

| Data category | Fields | Subject | Collected at | Purpose | Stored in | Retention (unconfirmed) | Evidence |
|---|---|---|---|---|---|---|---|
| Identity | first_name, last_name, full_name, avatar_url, job_title | Learner, staff | Sign-up, profile, admin import | Run the account, name the certificate | `profiles` | Account life + 7y training record | `001_schema.sql`, `020_emergency_contact.sql` |
| Contact | email, phone | Learner, staff | Sign-up, profile | Service email, session logistics | `profiles`, Supabase `auth.users` | Account life | `001_schema.sql` |
| Credentials | password hash, session tokens | Learner, staff | Sign-up, sign-in | Authentication | Supabase Auth; browser `localStorage: vitalcare-auth` | Session life | `src/lib/supabase/client.ts` |
| Emergency contact | emergency_contact_name, emergency_contact_phone | **A third party, not the account holder** | Profile settings | Reach someone if a learner is unwell in training | `profiles` | Account life | `020_emergency_contact.sql` |
| Training records | enrolments, lesson progress, attempts, answers, scores | Learner | Learning platform | Deliver and evidence training | `enrollments`, `lesson_progress`, `assessment_attempts`, `attempt_answers` | Stated 7y | `001_schema.sql` |
| Certificates | holder name, course, issue and expiry dates, certificate number | Learner | On completion | Issue and verify CPD certificates | `learner_certificates` | Stated 7y | `069_issue_course_certificate.sql` |
| Attendance | present/absent/late/excused, marked_by | Learner | Sessions module | Evidence of attendance | `attendance_records` | Stated 7y | `001_schema.sql` |
| Compliance | mandatory course status, renewal dates | Staff, learner | Training matrix | Employer compliance reporting | `staff_training_records`, `staff_training_requirements` | REQUIRES OWNER INPUT | `061_staff_compliance.sql` |
| Communications | messages, announcements, forum posts, blog posts and likes, mail | Learner, staff | In-platform | Communication | `messages`, `announcements`, `forum_posts`, `mail_messages`, `user_mail_accounts` | REQUIRES OWNER INPUT | `007_communication.sql`, `024_user_mail.sql` |
| Enquiries | name, email, organisation, phone, message | Prospect | Public contact form | Answer the enquiry | **Not stored in the database.** Emailed to the admin inbox via Resend | Lives in the mailbox, so the mailbox is the retention control | `supabase/functions/contact-form/index.ts` |
| Commerce | orders, order items, invoices, coupon redemptions, subscriptions | Customer | Store and billing | Take and record payment | `orders`, `invoices`, `coupons` | Stated 6y (HMRC) | `016_store.sql`, `028_invoices.sql` |
| Payroll | staff_name, staff_email, period, gross, deductions, net | Staff | Payroll module | Record payslips | `payroll` | REQUIRES OWNER INPUT | `031_payroll.sql` |
| Uploads | files and their metadata | Learner, staff | File manager, messages, courses | Course material and attachments | Supabase Storage | REQUIRES OWNER INPUT | `029_files_bucket.sql` |
| Notifications | notification rows, web push endpoint and keys | Learner, staff | Platform, browser push opt-in | Notify | `notifications`, `push_subscriptions` | Until unsubscribed | `src/lib/push.ts` |
| Integration tokens | Google OAuth refresh tokens | Staff | Connecting Google | Calendar, Meet, Drive | `google_oauth_tokens`, no client policy, service role only | Until disconnected | `067_google_oauth_token_lockdown.sql` |
| Audit | user_id, action, entity, metadata | Staff | Administrative actions | Accountability | `audit_logs` | REQUIRES OWNER INPUT | `001_schema.sql` |
| Server logs | IP address, user agent, timestamps | Everyone | Every request | Operate and secure the service | Supabase and the cPanel host | Provider defaults, REQUIRES OWNER INPUT | Provider configuration, not in this repo |

No date of birth, national insurance number, NHS number, ethnicity, health or
other special category column exists in the schema. Free text fields could
still receive such data, which is why the Privacy Policy asks people not to put
it there.

## Recipients and where they are

| Recipient | What it receives | Where | Evidence |
|---|---|---|---|
| Supabase | Everything in the database, storage and auth | Project region REQUIRES OWNER INPUT | `src/lib/supabase/client.ts` |
| cPanel host (premium17.web-hosting.com) | Static site requests and server logs | UK | `package.json` deploy scripts |
| Resend | Transactional and contact form email | US | `supabase/functions/send-email`, `contact-form` |
| Google Fonts | Visitor IP, user agent, referring page | US | `index.html`, verified at runtime |
| Unsplash | Visitor IP, user agent, referring page | US | `src/data/marketing-images.ts`, verified at runtime |
| Google (OAuth, Calendar, Meet, Drive) | Account identity and calendar or file data, only when connected | US | `supabase/functions/g*`, `drive-*` |
| Zoom | Session and host details | US | `supabase/functions/zoom-*` |
| Jitsi Meet (meet.jit.si) | Room name derived from a session id | EU | `src/lib/queries/sessions.queries.ts` |
| Google AI (Gemini) | Text submitted to the writing assistant | US | `supabase/functions/ai-chat/index.ts` |
| OpenRouter | Same, when Google is unavailable | US | `supabase/functions/ai-chat/index.ts` |
| OpenWeather | City name only, no user data | US | `src/lib/integrations/weather.ts` |
| Course video hosts | Whatever the embedded player receives | Depends on the URL an author pasted | `LessonPlayerPage.tsx` |

## Cookies and browser storage

Verified at runtime, production build, clean profile.

| Name | Kind | Set where | Purpose | Category | Life |
|---|---|---|---|---|---|
| (none) | Cookie | Public site | The public site sets no cookies | n/a | n/a |
| `sidebar_state` | Cookie | Platform | Sidebar open or collapsed | Preference | 7 days |
| `vitalcare-auth` | localStorage | Platform | Keeps you signed in | Strictly necessary | Until sign-out |
| `ui-theme`, `theme` | localStorage | Both | Light or dark appearance | Preference | Until cleared |
| `vc-liked-posts` | localStorage | Public blog | One like per browser | Preference | Until cleared |
| `vc-notif-*` (3 keys) | localStorage | Platform | Notification preferences | Preference | Until cleared |
| `vitalcare-session-locked` | sessionStorage | Platform | Idle lock survives a refresh | Strictly necessary | Tab life |
| `vc-chunk-reloaded` | sessionStorage | Both | One-shot recovery after a release | Strictly necessary | Tab life |
| `vitalcare-weather` | sessionStorage | Platform | 5 minute weather cache | Preference | Tab life |

No analytics, no tag manager, no advertising pixel, no session replay and no
heatmap exists anywhere in the codebase or in the runtime network log. There is
therefore nothing that a consent banner would gate, which is why there is none.

## Rights pathways

| Right | Route | Status |
|---|---|---|
| Access, portability | Settings, Privacy tab, "Download my data" | Built, `src/lib/queries/privacy.queries.ts` |
| Rectification | Settings, Account tab | Existing |
| Erasure | Email request to info@vitalcare.uk | Manual. No self-service delete, because retention periods would override it |
| Restriction, objection, withdrawal of consent | Email request | Manual |

The manual routes depend on a person answering info@vitalcare.uk within a
month. That is an operational commitment, not a technical control.

## Open items

Owner:

1. Confirm the ICO registration number and put it on the Privacy Policy, or
   confirm registration is not required.
2. Confirm the Supabase project region and whether data rests in the UK, EU or
   US.
3. Confirm the transfer safeguard in place with each provider outside the UK.
4. Confirm or set retention for compliance records, communications, uploads,
   payroll and audit logs.
5. Confirm what deletion means in practice: which records are removed, which
   are anonymised, and which are kept for the stated periods.
6. Decide whether Google Fonts and Unsplash should be self-hosted. Both are
   avoidable third-party requests on every public page view.

Legal counsel:

1. The 7 year and 6 year retention periods, and the legal obligation cited for
   each.
2. Whether the refund rules meet the Consumer Contracts Regulations 2013 for
   consumers buying at a distance, including the 14 day cancellation right and
   the consent needed before it is lost.
3. The lawful basis stated for each purpose.
4. Whether the certificate verification page discloses the right amount.
