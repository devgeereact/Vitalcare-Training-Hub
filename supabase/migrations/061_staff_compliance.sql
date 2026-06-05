-- 061_staff_compliance.sql
-- Staff training compliance: a per-course renewal interval, a global list of
-- mandatory courses, and completion records per staff member. Powers the
-- Training Matrix module and its live export.

-- ---------------------------------------------------------------------------
-- Role helpers. Defined in the private schema like the other RLS helpers
-- (migration 056) so they are not exposed as REST RPCs, and because
-- current_role_value now lives in private.
-- ---------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select coalesce(
    private.current_role_value() in ('manager', 'admin', 'super_admin'),
    false
  );
$$;

-- Any internal staff member (everyone who is not a learner or guest).
create or replace function private.is_internal()
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select coalesce(
    private.current_role_value() in
      ('content_editor', 'trainer', 'manager', 'admin', 'super_admin'),
    false
  );
$$;

grant execute on function private.is_manager() to anon, authenticated;
grant execute on function private.is_internal() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Course renewal interval
-- ---------------------------------------------------------------------------
alter table public.courses
  add column if not exists renewal_months integer; -- null = no renewal

-- ---------------------------------------------------------------------------
-- Which courses are mandatory for staff (global in v1: role/department null)
-- ---------------------------------------------------------------------------
create table if not exists public.staff_training_requirements (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses (id) on delete cascade,
  role          user_role,
  department_id uuid references public.departments (id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (course_id, role, department_id)
);

-- ---------------------------------------------------------------------------
-- Completion records
-- ---------------------------------------------------------------------------
create table if not exists public.staff_training_records (
  id             uuid primary key default gen_random_uuid(),
  staff_id       uuid not null references public.profiles (id) on delete cascade,
  course_id      uuid not null references public.courses (id) on delete cascade,
  completed_on   date not null,
  renewal_months integer, -- snapshot at time of record
  trainer_id     uuid references public.profiles (id) on delete set null,
  certificate_id uuid references public.learner_certificates (id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index if not exists staff_training_records_staff_idx
  on public.staff_training_records (staff_id);
create index if not exists staff_training_records_course_idx
  on public.staff_training_records (course_id);

-- ---------------------------------------------------------------------------
-- RLS: internal staff read, managers write
-- ---------------------------------------------------------------------------
alter table public.staff_training_requirements enable row level security;
alter table public.staff_training_records enable row level security;

drop policy if exists str_req_select on public.staff_training_requirements;
create policy str_req_select on public.staff_training_requirements for select
  using (private.is_internal());

drop policy if exists str_req_write on public.staff_training_requirements;
create policy str_req_write on public.staff_training_requirements for all
  using (private.is_manager()) with check (private.is_manager());

drop policy if exists str_rec_select on public.staff_training_records;
create policy str_rec_select on public.staff_training_records for select
  using (private.is_internal());

drop policy if exists str_rec_write on public.staff_training_records;
create policy str_rec_write on public.staff_training_records for all
  using (private.is_manager()) with check (private.is_manager());
