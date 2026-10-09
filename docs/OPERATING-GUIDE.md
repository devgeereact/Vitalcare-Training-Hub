# Operating guide

The short version of how a booking becomes a certificate, and who is
accountable at each step. Based on the lean launch proposal of 14 September
2026.

**These responsibilities are proposed, not accepted.** Nobody named here has
agreed to them in writing yet.

## One process

| Stage | Accountable | Done means |
|---|---|---|
| Enquiry | Booking coordinator | Recorded, owner assigned, next action and date set |
| Quote | Gideon, or a named commercial lead | Course, date, capacity, price and terms agreed in writing |
| Booking and payment | Booking coordinator | Order placed in the platform, reference given to the client, payment independently checked, or credit explicitly approved |
| Learner access | Booking coordinator | Learners enrolled, and one of them has actually opened the course |
| Delivery | Assigned trainer | Delivered, attendance recorded, problems escalated |
| Assessment and certificate | Trainer, with Harni owning standards | Pass criteria met, one certificate issued, dates and verification checked |
| Close and renew | Booking coordinator | Records sent, payment reconciled, feedback captured, next review date set |

One person may hold several roles. Name a backup for each.

## The daily ten minutes

Five questions, in this order:

1. **Unconfirmed payments.** Platform, Store, Orders, filtered to pending.
   Check receipt independently against the bank. A screenshot or a remittance
   email is not reconciliation. Confirm in the platform: confirming is what
   enrols the buyer, so do not confirm before the money is there.
2. **Today's deliveries.** Trainer confirmed, venue or joining link confirmed,
   learners enrolled.
3. **Blocked learner access.** Anyone who cannot sign in, has not received a
   confirmation email, or is not enrolled on a course they have paid for.
4. **Certificate exceptions.** Certificates awaiting approval, and anybody who
   has completed a course but has no certificate.
5. **Tomorrow's readiness.** Anything in the first four that will not be fixed
   today.

Every exception gets one owner and a next action with a date.

## The weekly half hour

Six measures, from dated source records, not from a dashboard tile:

- Qualified enquiries this week.
- Confirmed bookings, and their value.
- **Cash actually received**, shown separately from value invoiced.
- **Sessions actually delivered**, excluding future and cancelled ones.
- **Learners completing training**, excluding registrations.
- Unresolved learner or certificate issues, with the age of the oldest.

The live **Business Overview** export now produces the middle four directly,
one row per measure with the rule that produced it written beside it. Read that
column: "Learners trained" counts people who completed something, and is a
different number from "Course completions" and from the learner accounts on the
dashboard.

The live **Finance Tracker** export keeps **Invoiced** and **Received** in
separate columns with separate totals. Do not add them together. It shows no
VAT at all until the accountant confirms registration and the rate, at which
point `VAT.registered` in `src/lib/constants.ts` is set to true and the rate
appears in the column heading.

Any sheet whose tab ends "(blank template)" has no data source. It is a form to
fill in, not a report saying zero.

## Payments, as they actually work

There is no payment processor. PayPal is a label on a dropdown, not an
integration. The process is:

1. The buyer places an order in the platform and is shown a reference in the
   form `VC-YYMM-NNNN`, the amount, and where to pay.
2. They pay by bank transfer or PayPal, quoting that reference.
3. Staff check receipt against the bank, then press **Confirm** on that order.
4. Confirming marks it paid, enrols the buyer on every course in the order, and
   records who confirmed it. It is safe to press twice: the second press is
   refused and says so.

Two other buttons:

- **Cancel** an order that is awaiting payment. This returns any coupon use the
  order had reserved.
- **Record refund** against an order that has been paid. The coupon use stays
  spent, because the sale happened.

An order cannot be confirmed after it has been cancelled, and cannot be
refunded before it has been paid. The platform refuses both.

## Certificates

A certificate is created when a learner completes every lesson and passes the
published assessment, and it is **not issued until an administrator approves
it**. Until then, public verification reports "No valid certificate for that
code" and withholds the learner's name. That is deliberate: the company should
not vouch for a certificate it has not approved.

Verification has three answers, and they are not interchangeable:

| Answer | Meaning |
|---|---|
| Valid certificate | Approved, and in date |
| Certificate expired | Genuine, past its renewal date, refresher due |
| No valid certificate for that code | Either unknown, withdrawn, or approved by nobody |

Expiry comes from the course's renewal period, counted in calendar months from
issue. 31 January plus one month is 28 February, not 3 March: the platform and
the database now agree on that.

**A course with no renewal period issues certificates that never expire.** That
is the right answer for some courses and the wrong one for most statutory
ones, and it is a clinical decision, not a technical default. Certificates
issued before September 2026 may also carry no expiry, because of a defect in
the completion path that is now fixed going forward. Backfilling those is a
deliberate step, with a pre-flight query, in `SQL-EDITOR-RUNBOOK.md`: doing it
can make an old certificate lapse instantly and email its holder the next
morning.

## Where things live

| | |
|---|---|
| Readiness, and what is blocking launch | `docs/LAUNCH-READINESS.md` |
| What was tested, and what was not | `docs/TEST-REPORT.md` |
| Standing up a safe test environment | `docs/LOCAL-ENVIRONMENT.md` |
| Deploying, with rollback | `docs/DEPLOYMENT.md` |
| Personal data inventory | `docs/PRIVACY-DATA-MAP.md` |

Keep one launch register outside the platform, in a tool the team already uses:
booking ID, client, course and date, learner count, status, owner, next action
and date, order reference, payment state, delivery issue. It connects the work.
It does not duplicate learner records or certificates, which stay in the
platform.

Historical documents, kept for their reasoning and clearly labelled, are
`docs/FEATURES.md`, `docs/DEPLOYMENT-092-093.md`, `docs/SQL-EDITOR-RUNBOOK.md`
and `docs/specs/`. Do not treat them as current status.
