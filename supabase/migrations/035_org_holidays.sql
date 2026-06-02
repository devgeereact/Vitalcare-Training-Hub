-- 035_org_holidays.sql
-- Organisation-defined holidays / closures. These render as all-day blocks on
-- the calendar and as markers in the trainer timetable, BEFORE anything is
-- scheduled. UK public holidays continue to come from the Nager.Date API; this
-- table is for company closures, training-room blackouts and bank-holiday tops-ups.
-- Idempotent: safe to re-run.

create table if not exists public.org_holidays (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- single-day holiday: starts_on = ends_on. Multi-day closure: a range.
  starts_on   date not null,
  ends_on     date not null,
  notes       text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists org_holidays_starts_on_idx on public.org_holidays (starts_on);

alter table public.org_holidays enable row level security;

-- Any authenticated user can read holidays (they appear on the shared calendar).
drop policy if exists "org_holidays_read" on public.org_holidays;
create policy "org_holidays_read"
  on public.org_holidays for select
  to authenticated
  using (true);

-- Only staff (admin / super_admin / manager / trainer) can manage holidays.
drop policy if exists "org_holidays_write" on public.org_holidays;
create policy "org_holidays_write"
  on public.org_holidays for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin', 'manager', 'trainer')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin', 'manager', 'trainer')
    )
  );
