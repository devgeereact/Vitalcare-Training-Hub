-- ============================================================================
-- Vitalcare Training Hub — Email campaigns / drip (Phase 10)
-- Scheduled email sends, processed by the process-email-drip Edge Function on a
-- pg_cron schedule. is_staff() is defined in 001_schema.sql.
-- ============================================================================

create table if not exists public.email_campaigns (
  id            uuid primary key default gen_random_uuid(),
  subject       text not null,
  message       text not null,
  audience      text not null default 'all_learners',
  scheduled_at  timestamptz not null default now(),
  status        text not null default 'scheduled'
                check (status in ('scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  sent_count    integer not null default 0,
  total_count   integer not null default 0,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz
);
create index if not exists email_campaigns_due_idx
  on public.email_campaigns (status, scheduled_at);

alter table public.email_campaigns enable row level security;

drop policy if exists email_campaigns_select on public.email_campaigns;
create policy email_campaigns_select on public.email_campaigns for select
  using (public.is_staff());
drop policy if exists email_campaigns_insert on public.email_campaigns;
create policy email_campaigns_insert on public.email_campaigns for insert
  with check (public.is_staff() and created_by = auth.uid());
drop policy if exists email_campaigns_update on public.email_campaigns;
create policy email_campaigns_update on public.email_campaigns for update
  using (public.is_staff())
  with check (public.is_staff());
