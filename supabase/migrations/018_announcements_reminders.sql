-- ============================================================================
-- Vitalcare Training Hub — Announcement acknowledgements + reminders (Phase 12)
-- Pop-up announcements users acknowledge; sequenced reminders that fire as
-- notifications (which already trigger web-push).
-- ============================================================================

-- Optional action time on an announcement (drives the reminder sequence).
alter table public.announcements add column if not exists action_at timestamptz;

-- Who has acknowledged which announcement.
create table if not exists public.announcement_acks (
  id              uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  unique (announcement_id, user_id)
);
create index if not exists announcement_acks_user_idx on public.announcement_acks (user_id);

-- Scheduled reminders -> become notifications when due.
create table if not exists public.reminders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text,
  link       text,
  remind_at  timestamptz not null,
  sent       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reminders_due_idx on public.reminders (sent, remind_at);

alter table public.announcement_acks enable row level security;
alter table public.reminders enable row level security;

drop policy if exists announcement_acks_select on public.announcement_acks;
create policy announcement_acks_select on public.announcement_acks for select
  using (user_id = auth.uid() or public.is_staff());
drop policy if exists announcement_acks_insert on public.announcement_acks;
create policy announcement_acks_insert on public.announcement_acks for insert
  with check (user_id = auth.uid());

drop policy if exists reminders_all on public.reminders;
create policy reminders_all on public.reminders for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
