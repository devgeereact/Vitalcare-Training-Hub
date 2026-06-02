-- ============================================================================
-- Vitalcare Training Hub — Per-employee mail accounts (Phase 13)
-- Each user can connect their own SMTP/IMAP to send + receive on their account.
-- Credentials live in a locked table (no client RLS); only Edge Functions read
-- them via the service role. Users set them through the user-mail function.
-- ============================================================================

create table if not exists public.user_mail_accounts (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  from_name  text,
  email      text not null,
  smtp_host  text not null,
  smtp_port  integer not null default 465,
  smtp_pass  text not null,
  imap_host  text,
  imap_port  integer not null default 993,
  active     boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.user_mail_accounts enable row level security;
-- No policies: invisible to clients. Service role (Edge Functions) only.

-- Tag inbox messages with their owner so each user sees only their mail.
alter table public.mail_messages add column if not exists owner_id uuid references public.profiles (id) on delete cascade;
create index if not exists mail_owner_idx on public.mail_messages (owner_id);

-- Owners read their own mail (org inbox rows have null owner -> staff-visible).
drop policy if exists mail_select on public.mail_messages;
create policy mail_select on public.mail_messages for select
  using (owner_id = auth.uid() or (owner_id is null and public.is_staff()));
drop policy if exists mail_update on public.mail_messages;
create policy mail_update on public.mail_messages for update
  using (owner_id = auth.uid() or (owner_id is null and public.is_staff()))
  with check (owner_id = auth.uid() or (owner_id is null and public.is_staff()));
