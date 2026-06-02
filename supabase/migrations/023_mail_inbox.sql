-- ============================================================================
-- Vitalcare Training Hub — Mail inbox (Phase 13)
-- Stores messages pulled from the org mailbox over IMAP. Staff-read only.
-- ============================================================================

create table if not exists public.mail_messages (
  id          uuid primary key default gen_random_uuid(),
  message_id  text unique,
  uid         bigint,
  from_name   text,
  from_addr   text,
  subject     text,
  snippet     text,
  body_html   text,
  received_at timestamptz,
  seen        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists mail_received_idx on public.mail_messages (received_at desc);

alter table public.mail_messages enable row level security;

-- Staff read; updates (mark seen) by staff. No client insert (Edge Function only).
drop policy if exists mail_select on public.mail_messages;
create policy mail_select on public.mail_messages for select
  using (public.is_staff());
drop policy if exists mail_update on public.mail_messages;
create policy mail_update on public.mail_messages for update
  using (public.is_staff()) with check (public.is_staff());
