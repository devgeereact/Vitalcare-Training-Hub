-- 070_public_config.sql
-- Exposes only whitelisted PUBLIC configuration values to the client (including
-- pre-auth pages like sign-in). Currently just the Turnstile site key, which is
-- public by design. The secret and every other integration setting stay
-- service-role only. SECURITY DEFINER so it can read the locked
-- integration_settings table, but it returns ONLY the named public keys.

create or replace function public.get_public_config()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(name, value), '{}'::jsonb)
  from public.integration_settings
  where name in ('TURNSTILE_SITE_KEY');
$$;

grant execute on function public.get_public_config() to anon, authenticated;
