-- ============================================================================
-- Vitalcare Training Hub — Learning paths (Phase 11)
-- Ordered sequences of courses. is_staff() from 001_schema.sql.
-- ============================================================================

create table if not exists public.learning_paths (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  thumbnail_url text,
  is_published  boolean not null default false,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table if not exists public.learning_path_courses (
  id        uuid primary key default gen_random_uuid(),
  path_id   uuid not null references public.learning_paths (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  position  integer not null default 0,
  unique (path_id, course_id)
);
create index if not exists lpc_path_idx on public.learning_path_courses (path_id);

alter table public.learning_paths enable row level security;
alter table public.learning_path_courses enable row level security;

-- Published paths readable by any authenticated user; staff see + manage all.
drop policy if exists learning_paths_select on public.learning_paths;
create policy learning_paths_select on public.learning_paths for select
  using (is_published or public.is_staff());
drop policy if exists learning_paths_write on public.learning_paths;
create policy learning_paths_write on public.learning_paths for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists lpc_select on public.learning_path_courses;
create policy lpc_select on public.learning_path_courses for select
  using (auth.uid() is not null);
drop policy if exists lpc_write on public.learning_path_courses;
create policy lpc_write on public.learning_path_courses for all
  using (public.is_staff()) with check (public.is_staff());
