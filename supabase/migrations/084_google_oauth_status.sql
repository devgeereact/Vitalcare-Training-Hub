-- 084_google_oauth_status.sql
--
-- Fixes the Google connection status in Settings, which has read "not
-- connected" since migration 067 regardless of the real state.
--
-- 067 correctly revoked all client access to google_oauth_tokens, because RLS
-- is row-level and any SELECT policy would have exposed the refresh_token
-- column over the REST API. But GoogleIntegrationCard still queried that table
-- straight from the browser, so it now always reads null and the card can never
-- show a connection. The edge functions were unaffected: they use the
-- service-role key and bypass RLS, so Meet link creation has worked throughout.
-- Only the badge was wrong.
--
-- This exposes connection *status* without exposing the token: a security
-- definer function returning the two non-secret columns and nothing else.
--
-- The admin check is inlined against profiles rather than calling
-- private.is_admin(), so this migration depends on nothing but profiles and
-- auth.uid(). An earlier version called the helper and the whole migration
-- failed to apply.

drop function if exists public.google_oauth_status();

create function public.google_oauth_status()
returns table (connected_email text, connected_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select t.connected_email::text, t.created_at
  from public.google_oauth_tokens t
  where exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  )
  order by t.created_at desc
  limit 1;
$$;

comment on function public.google_oauth_status() is
  'Google connection status for the Settings page. Returns only connected_email and created_at: refresh_token must never be reachable from a client. Non-admins get zero rows.';

-- Execute only. The underlying table stays unreachable to client roles.
revoke all on function public.google_oauth_status() from public;
revoke all on function public.google_oauth_status() from anon;
grant execute on function public.google_oauth_status() to authenticated;

-- PostgREST caches the schema; without this the new function 404s as PGRST202.
notify pgrst, 'reload schema';
