-- 005_google_oauth.sql
-- Google OAuth (Calendar + Meet) connection + Meet link on sessions.
-- One org-wide connection row; the refresh token is written by the
-- google-oauth-callback Edge Function (service role) and read only by admins.

create table if not exists public.google_oauth_tokens (
  id              uuid primary key default gen_random_uuid(),
  refresh_token   text not null,
  scope           text,
  connected_email text,
  connected_by    uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.google_oauth_tokens enable row level security;

-- Admins may see whether Google is connected (not the token value via API,
-- but the row exists). Writes happen via the service role (Edge Function).
drop policy if exists google_oauth_read on public.google_oauth_tokens;
create policy google_oauth_read on public.google_oauth_tokens for select
  using (public.is_admin());

-- Meet link on training sessions
alter table public.training_sessions
  add column if not exists meet_url text;
