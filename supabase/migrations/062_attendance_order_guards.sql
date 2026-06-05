-- 062_attendance_order_guards.sql
-- Integrity hardening for two trust-the-client write paths. The app guards these
-- already, but RLS lets a determined client write directly over REST, so the
-- rules are enforced at the database with triggers.

-- ───────────────────────────────────────────────────────────────────────────
-- 1. attendance_records: a learner may only mark THEIR OWN attendance, as
--    'present', for a session they are booked on, and only within the session
--    window (30 min before start to 12 h after end). Staff mark anyone freely.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.guard_attendance_self_insert()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_start timestamptz;
  v_end   timestamptz;
begin
  if private.is_staff() then
    return new;
  end if;

  if new.learner_id is distinct from auth.uid() then
    raise exception 'You can only mark your own attendance';
  end if;

  new.status := 'present';
  new.marked_by := auth.uid();

  if not exists (
    select 1 from public.session_bookings
    where session_id = new.session_id and learner_id = auth.uid()
  ) then
    raise exception 'You are not booked on this session';
  end if;

  select starts_at, ends_at into v_start, v_end
  from public.training_sessions
  where id = new.session_id;
  if v_start is not null and now() < v_start - interval '30 minutes' then
    raise exception 'This session has not started yet';
  end if;
  if v_end is not null and now() > v_end + interval '12 hours' then
    raise exception 'This session has ended';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_attendance_self_insert on public.attendance_records;
create trigger guard_attendance_self_insert
  before insert or update on public.attendance_records
  for each row
  execute function public.guard_attendance_self_insert();

revoke all on function public.guard_attendance_self_insert()
  from public, anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. orders: a buyer cannot create an order already marked paid/confirmed. Force
--    non-staff inserts to 'pending'; staff may set any status.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function public.guard_order_status()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.is_staff() then
    new.status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_order_status on public.orders;
create trigger guard_order_status
  before insert on public.orders
  for each row
  execute function public.guard_order_status();

revoke all on function public.guard_order_status()
  from public, anon, authenticated;
