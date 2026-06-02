-- Migration 040: Department collaboration spaces.
-- Adds department membership and a simple per-department task board.
-- Idempotent. RLS enabled on every new table.
--
-- Access model:
--   * super_admin creates departments and assigns members (departments table
--     write already gated to is_admin(); membership assignment gated below).
--   * Department members can read their department's tasks and collaborate
--     (create/update tasks within their department).
--   * Staff (is_staff) and admins can manage all departments' members + tasks.

-- ------------------------------------------------------------- members ------
create table if not exists public.department_members (
  id              uuid primary key default gen_random_uuid(),
  department_id   uuid not null references public.departments (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (department_id, user_id)
);

create index if not exists department_members_dept_idx
  on public.department_members (department_id);
create index if not exists department_members_user_idx
  on public.department_members (user_id);

-- --------------------------------------------------------------- tasks ------
create table if not exists public.department_tasks (
  id              uuid primary key default gen_random_uuid(),
  department_id   uuid not null references public.departments (id) on delete cascade,
  title           text not null,
  description     text,
  assignee_id     uuid references public.profiles (id) on delete set null,
  status          text not null default 'todo'
                    check (status in ('todo', 'doing', 'done')),
  due_date        date,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists department_tasks_dept_idx
  on public.department_tasks (department_id);
create index if not exists department_tasks_assignee_idx
  on public.department_tasks (assignee_id);

-- keep updated_at fresh
create or replace function public.touch_department_task()
  returns trigger
  language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_department_task on public.department_tasks;
create trigger trg_touch_department_task
  before update on public.department_tasks
  for each row execute function public.touch_department_task();

-- ----------------------------------------------------- membership helper ----
-- Is the current user a member of the given department? SECURITY DEFINER so the
-- task policies can check membership without recursing through RLS.
create or replace function public.is_department_member(dept uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path to 'public'
as $$
  select exists (
    select 1
    from public.department_members dm
    where dm.department_id = dept
      and dm.user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------------ RLS ------
alter table public.department_members enable row level security;
alter table public.department_tasks  enable row level security;

-- Members: staff/admins manage; a user may see the rows for departments they
-- belong to (so the UI can list their own membership).
drop policy if exists department_members_select on public.department_members;
create policy department_members_select on public.department_members
  for select using (
    public.is_staff() or user_id = auth.uid()
  );

drop policy if exists department_members_write on public.department_members;
create policy department_members_write on public.department_members
  for all using (public.is_admin()) with check (public.is_admin());

-- Tasks: members of the department can read and collaborate; staff/admins
-- manage everything.
drop policy if exists department_tasks_select on public.department_tasks;
create policy department_tasks_select on public.department_tasks
  for select using (
    public.is_staff() or public.is_department_member(department_id)
  );

drop policy if exists department_tasks_insert on public.department_tasks;
create policy department_tasks_insert on public.department_tasks
  for insert with check (
    public.is_staff() or public.is_department_member(department_id)
  );

drop policy if exists department_tasks_update on public.department_tasks;
create policy department_tasks_update on public.department_tasks
  for update using (
    public.is_staff() or public.is_department_member(department_id)
  ) with check (
    public.is_staff() or public.is_department_member(department_id)
  );

drop policy if exists department_tasks_delete on public.department_tasks;
create policy department_tasks_delete on public.department_tasks
  for delete using (
    public.is_staff() or public.is_department_member(department_id)
  );
