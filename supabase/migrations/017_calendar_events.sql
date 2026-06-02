-- ============================================================================
-- Vitalcare Training Hub — Custom calendar events (Phase 12)
-- Ad-hoc events shown alongside sessions and holidays in the calendar.
-- ============================================================================

create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  all_day     boolean not null default false,
  color       text not null default '#16a34a',
  link        text,
  created_by  uuid references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists calendar_events_owner_idx on public.calendar_events (created_by);
create index if not exists calendar_events_start_idx on public.calendar_events (starts_at);

alter table public.calendar_events enable row level security;

-- Owners manage their own events; staff can see everyone's.
drop policy if exists calendar_events_select on public.calendar_events;
create policy calendar_events_select on public.calendar_events for select
  using (created_by = auth.uid() or public.is_staff());
drop policy if exists calendar_events_write on public.calendar_events;
create policy calendar_events_write on public.calendar_events for all
  using (created_by = auth.uid()) with check (created_by = auth.uid());
