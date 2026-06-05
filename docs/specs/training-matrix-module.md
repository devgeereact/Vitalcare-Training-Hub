# Spec: Training Matrix module (staff compliance)

Status: Draft for review. No code written yet.
Owner: Gideon. Priority: P1.

## Problem

Vitalcare delivers CSTF-aligned mandatory training. There is no record of which
**staff** hold which mandatory training, when it was completed, or when it falls
due. The Reports feature ships a Training Matrix workbook as a blank template
only, because no backing data exists. Without this, the company cannot answer a
CQC or client audit question: "show me your team is compliant."

## Outcome

A platform module that tracks, per staff member, the status of each mandatory
course (Current / Overdue / Due soon / Not recorded), with due dates driven by a
per-course renewal interval. It powers a live Training Matrix export and a
compliance dashboard. Admins and managers maintain it; trainers see their own.

## Scope

In:
- Define which courses are mandatory for staff, and their renewal interval.
- Record completion dates per staff member per mandatory course.
- Compute status and next-due date.
- Matrix UI (staff x course grid) + per-staff detail.
- Live Training Matrix export wired off this data.
- Compliance summary on the dashboard / analytics.

Out (later):
- Learner compliance (this is staff only).
- Automated reminder emails (phase 2; data model leaves room for it).
- Evidence file upload per record (phase 2).

## Data model

Two new tables plus one column on `courses`.

### `courses.renewal_months` (new column)
```sql
alter table public.courses
  add column if not exists renewal_months integer; -- null = no renewal
```
Drives due-date maths. e.g. BLS = 12, Safeguarding = 36.

### `staff_training_requirements` (which courses staff must hold)
```sql
create table if not exists public.staff_training_requirements (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  -- optional scoping: a requirement can apply to a role and/or department,
  -- null = applies to all staff.
  role        user_role,
  department_id uuid references public.departments (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (course_id, role, department_id)
);
```

### `staff_training_records` (completion events)
```sql
create table if not exists public.staff_training_records (
  id             uuid primary key default gen_random_uuid(),
  staff_id       uuid not null references public.profiles (id) on delete cascade,
  course_id      uuid not null references public.courses (id) on delete cascade,
  completed_on   date not null,
  -- snapshot so history survives a later course renewal_months change.
  renewal_months integer,
  trainer_id     uuid references public.profiles (id) on delete set null,
  certificate_id uuid references public.learner_certificates (id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index on public.staff_training_records (staff_id);
create index on public.staff_training_records (course_id);
```

Due date is derived, not stored: `completed_on + renewal_months` of the latest
record. Status is computed at read time so it never goes stale.

### Status rule (computed)
- No record -> **Not recorded**.
- `now > completed_on + renewal_months` -> **Overdue**.
- within 30 days of due -> **Due soon**.
- else -> **Current**.
- `renewal_months` null -> **Current** once recorded (no expiry).

## RLS (mirror existing patterns in 002_rls.sql / 055)

- `staff_training_requirements`: select for any authenticated staff
  (super_admin, admin, manager, trainer); insert/update/delete for
  super_admin, admin, manager.
- `staff_training_records`: select own row for trainer (staff_id = auth.uid());
  full select for super_admin/admin/manager; insert/update/delete for
  super_admin/admin/manager. No deletes flip RLS off — soft delete via
  deleted_at, consistent with the rest of the schema.

## Queries — `src/lib/queries/compliance.queries.ts` (new)

Follow the existing batch-join pattern (see certificates.queries.ts):

- `getMandatoryCourses(): MandatoryCourse[]` — courses flagged via a requirement
  (or `is_cstf_aligned`), with `renewal_months`.
- `getStaffMatrix(): MatrixStaffRow[]` — one row per staff member, with a
  `cells: Record<courseId, { completedOn, dueOn, status }>` map. Built from
  staff profiles (role in admin/manager/trainer/content_editor) x latest record
  per course. Status computed in JS via a shared `complianceStatus()` helper
  (colocated, like `certStatus`).
- `getComplianceSummary(): { course, current, dueSoon, overdue, notRecorded,
  compliancePct }[]` — per-course rollup for the dashboard.
- Mutations: `useUpsertTrainingRecord`, `useSetRequirement`,
  `useRemoveRequirement`. Invalidate a `complianceKeys` query key set.

Shared status helper exported for reuse by the export adapter:
```ts
export type ComplianceStatus = "current" | "due_soon" | "overdue" | "not_recorded"
export function complianceStatus(completedOn: string | null, renewalMonths: number | null): {
  status: ComplianceStatus; dueOn: string | null
}
```

## UI — `src/pages/platform/compliance/` (new)

Route `/platform/compliance`, RoleGuard `["super_admin","admin","manager","trainer"]`
(trainer sees own row only). Nav: new item under the existing **People** section
(near Staff / Departments), gated `MGMT_T`.

Pages/components:
- `ComplianceMatrixPage.tsx` — the grid. Rows = staff, columns = mandatory
  courses, cells = status chip (✓ Current / ⚠ Overdue / ◷ Due soon / – Not
  recorded) using brand colours (success / destructive / warning / muted).
  Sticky first column (staff name), horizontal scroll. Reuse `DataTable`
  patterns where practical, but the matrix is bespoke (pivot), so likely a
  custom table with the existing Card + Skeleton + empty/error states.
- Cell click -> `RecordTrainingDialog` (React Hook Form + Zod): staff, course,
  completed_on, trainer, optional link to an existing certificate, notes.
- `RequirementsPanel` (admin/manager) — manage which courses are mandatory and
  their renewal interval (writes `renewal_months` + requirement rows).
- `StaffComplianceDetail` — one staff member, full history per course.

Mandatory states on every data component: Skeleton loading, empty (no staff or
no requirements -> CTA to add requirements), error + retry. Focus rings per the
brand standard. UK English, no em-dashes.

## Export wiring (closes the Reports gap)

- New adapter `src/lib/exports/builders/training-matrix.ts` gains
  `buildTrainingMatrixLive(matrix, courses)`:
  - Maps `getStaffMatrix()` to the existing Matrix sheet: Staff Name, Job Role,
    and per course block Due / Completed / Status. Status arrives as a real
    value ("✓ Current" / "⚠ Overdue") rather than the template formula.
  - The four fixed course blocks (BLS, IPC, Manual Handling, Safeguarding) map
    to the four most-common mandatory courses, or generalise the sheet to N
    course blocks built from `getMandatoryCourses()`.
- `registry.ts`: flip `training-matrix` to `live: true`.
- `ReportsPage.tsx`: add `useStaffMatrix()` + `useMandatoryCourses()`, wire the
  `training-matrix` case in `liveSpec` / `liveLoading` / `liveCount`.

## Dashboard

Add a compliance widget to `AnalyticsPage` (or DashboardPage): overall
compliance %, count overdue, link to `/platform/compliance`. Source:
`getComplianceSummary()`.

## Implementation phases

1. Migration `061_staff_compliance.sql`: `courses.renewal_months`, two tables,
   indexes, RLS. Seed a few requirements + sample records behind a demo guard
   (optional, like 048_seed_learning_demo.sql).
2. `database.types.ts`: add the two table types + `renewal_months`.
3. `compliance.queries.ts`: reads, mutations, `complianceStatus` helper.
4. UI: matrix page, record dialog, requirements panel, route, nav.
5. Export: live builder + registry flip + ReportsPage wiring.
6. Dashboard widget.

Each phase is a working, committable unit.

## Verification

- `npm run typecheck` zero errors, no `any`; `npm run lint`; `npm run build`.
- Migration applies cleanly on a branch DB; RLS: a trainer sees only their own
  records, a manager sees all, a learner cannot reach the route.
- Record a completion -> matrix cell flips to Current; back-date past the
  renewal window -> Overdue; within 30 days -> Due soon.
- `scripts/verify-workbooks.mjs`: extend with a `buildTrainingMatrixLive`
  fixture asserting status strings land as values (not formulas) and the gold
  styling holds.
- Manual: open `/platform/compliance` as admin at 375px and desktop; export the
  live Training Matrix and confirm rows populate.

## Risks / decisions to confirm

- **Who counts as "staff"?** Proposed: profiles with role in
  (super_admin, admin, manager, trainer, content_editor). Confirm learners are
  excluded.
- **Requirement scoping** (global vs per-role/department) adds complexity. MVP
  could ship global-only (role/department null) and add scoping later; the
  schema already allows it.
- **Fixed 4-course matrix vs N courses.** The sample workbook has 4 fixed
  blocks; live data may have more/fewer mandatory courses. Recommend
  generalising the export sheet to N blocks from `getMandatoryCourses()`.
- Reuse `is_cstf_aligned` as the mandatory flag, or require explicit
  `staff_training_requirements` rows? Recommend explicit requirements (precise),
  falling back to none rather than guessing.
```
