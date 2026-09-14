# Current Task Contract

## Outcome

Prepare Vitalcare Training Hub for a controlled launch: correct the defects
that affect the core customer journey, prove the corrections against an
isolated database, and produce one dated readiness record with the decisions
and configuration still outstanding.

## Scope

- Local application and database changes needed for booking, payment,
  enrolment, account access, compliance dates, certificate verification and
  the two reporting workbooks.
- Regression tests for each correction, run against an isolated local Supabase
  stack, never the live project.
- One current readiness record, one operating guide, one deployment plan, and
  status labels on the historical documents.

## Outside scope

- Production changes, deployment, external messages, real payments.
- New AI features, payment processor integrations, subscriptions, dashboard
  expansion, cosmetic redesign.
- Rewriting the architecture or adding a second management system.

## Mode and workflow

- Primary mode: Existing Application.
- Workflow: Change Safety, then Release Gate.

## Evidence

`docs/TEST-REPORT.md` holds exact pass, fail and skip counts.
`docs/LAUNCH-READINESS.md` holds the issue register and the verdict.

## Completion

Local work is complete. The verdict is **not ready for a controlled pilot**:
six items remain, all of them configuration or decisions outside this
repository, listed in `docs/LAUNCH-READINESS.md` §2.

## Superseded

The previous contract, adopting GEE OS 0.5.0 locally, was completed in commit
`2b3310d`. It described instruction-layer migration, not this work.
