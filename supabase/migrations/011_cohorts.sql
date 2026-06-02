-- ============================================================================
-- Vitalcare Training Hub — Cohorts & teams (Phase 11)
-- Group learners for shared enrolment and reporting. is_staff() from 001.
-- ============================================================================

create table if not exists public.cohorts (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  organisation_id uuid references public.organisations (id) on delete cascade,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create table if not exists public.cohort_members (
  id          uuid primary key default gen_random_uuid(),
  cohort_id   uuid not null references public.cohorts (id) on delete cascade,
  learner_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (cohort_id, learner_id)
);
create index if not exists cohort_members_cohort_idx on public.cohort_members (cohort_id);

alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;

drop policy if exists cohorts_select on public.cohorts;
create policy cohorts_select on public.cohorts for select using (public.is_staff());
drop policy if exists cohorts_write on public.cohorts;
create policy cohorts_write on public.cohorts for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists cohort_members_select on public.cohort_members;
create policy cohort_members_select on public.cohort_members for select
  using (public.is_staff());
drop policy if exists cohort_members_write on public.cohort_members;
create policy cohort_members_write on public.cohort_members for all
  using (public.is_staff()) with check (public.is_staff());
