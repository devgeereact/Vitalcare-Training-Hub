-- 034_course_resources.sql
-- Resource Library: course materials with an audience (visibility) concept and
-- admin allocation. Learners see learner + both; trainers see trainer + both;
-- admins manage and allocate everything.
--
-- Idempotent: safe to re-run.

-- ─── Resource audience enum ──────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'resource_audience') then
    create type public.resource_audience as enum ('learner', 'trainer', 'both');
  end if;
end$$;

-- ─── Resources table ─────────────────────────────────────────────────────────
create table if not exists public.course_resources (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references public.courses(id) on delete cascade,
  title        text not null,
  description  text,
  file_url     text,
  link_url     text,
  kind         text not null default 'document', -- document | video | link | slide
  audience     public.resource_audience not null default 'both',
  is_published boolean not null default true,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index if not exists course_resources_course_idx
  on public.course_resources (course_id);
create index if not exists course_resources_audience_idx
  on public.course_resources (audience);

-- ─── Per-learner allocations ─────────────────────────────────────────────────
-- Optional targeted allocation: when rows exist for a resource, only the listed
-- learners (plus the audience rule) may see it. When none exist, the audience
-- rule alone governs visibility.
create table if not exists public.resource_allocations (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.course_resources(id) on delete cascade,
  learner_id  uuid not null references auth.users(id) on delete cascade,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (resource_id, learner_id)
);

create index if not exists resource_allocations_resource_idx
  on public.resource_allocations (resource_id);
create index if not exists resource_allocations_learner_idx
  on public.resource_allocations (learner_id);

-- ─── updated_at trigger ──────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists course_resources_touch on public.course_resources;
create trigger course_resources_touch
  before update on public.course_resources
  for each row execute function public.touch_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.course_resources    enable row level security;
alter table public.resource_allocations enable row level security;

-- course_resources -----------------------------------------------------------
drop policy if exists course_resources_staff_all on public.course_resources;
create policy course_resources_staff_all on public.course_resources
  for all to authenticated
  using (public.is_staff() or public.is_admin())
  with check (public.is_staff() or public.is_admin());

-- Trainers see trainer + both; learners see learner + both. Targeted
-- allocations: when any allocation rows exist for a resource, the current user
-- must be allocated (admins/staff bypass via the policy above).
drop policy if exists course_resources_read on public.course_resources;
create policy course_resources_read on public.course_resources
  for select to authenticated
  using (
    deleted_at is null
    and is_published = true
    and audience in ('learner', 'trainer', 'both')
    and (
      not exists (
        select 1 from public.resource_allocations ra
        where ra.resource_id = course_resources.id
      )
      or exists (
        select 1 from public.resource_allocations ra
        where ra.resource_id = course_resources.id
          and ra.learner_id = auth.uid()
      )
    )
  );

-- resource_allocations --------------------------------------------------------
drop policy if exists resource_allocations_staff_all on public.resource_allocations;
create policy resource_allocations_staff_all on public.resource_allocations
  for all to authenticated
  using (public.is_staff() or public.is_admin())
  with check (public.is_staff() or public.is_admin());

drop policy if exists resource_allocations_self_read on public.resource_allocations;
create policy resource_allocations_self_read on public.resource_allocations
  for select to authenticated
  using (learner_id = auth.uid());
