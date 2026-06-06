-- 067_google_oauth_token_lockdown.sql
-- SECURITY FIX for migration 005.
--
-- google_oauth_tokens.google_oauth_read granted SELECT to admins. RLS is
-- row-level, not column-level, so that exposed the refresh_token column over
-- the REST API to any admin. A long-lived Google refresh token must never be
-- client-reachable. The edge functions that use it (gmeet-create-event,
-- google-oauth-callback, etc.) connect with the service-role key and bypass
-- RLS, so removing all client policies does not affect them. RLS stays enabled
-- with no policy, which means no anon/authenticated access at all.

drop policy if exists google_oauth_read on public.google_oauth_tokens;
drop policy if exists google_oauth_write on public.google_oauth_tokens;
drop policy if exists google_oauth_all on public.google_oauth_tokens;

-- Belt and braces: revoke any table grants from client roles.
revoke all on table public.google_oauth_tokens from anon, authenticated;

-- RLS remains enabled; with no policy, client roles cannot read or write.
alter table public.google_oauth_tokens enable row level security;
