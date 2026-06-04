-- 056_security_definer_private.sql
-- Security advisor: anon/authenticated_security_definer_function_executable for
-- the RLS helper functions, and extension_in_public for pg_net.
--
-- Best practice: move the RLS helper functions OUT of the API-exposed `public`
-- schema into a `private` schema. PostgREST only exposes `public`, so they stop
-- being callable as /rest/v1/rpc/* — but RLS policies keep working because the
-- policy dependencies are by function OID (preserved by ALTER ... SET SCHEMA),
-- and the roles keep EXECUTE.
--
-- Idempotent: only moves helpers still in public, and rebuilds the bodies in
-- private. Safe to re-run after a partial run. Atomic per statement.

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- 1. Relocate the helpers still in public (OID preserved -> policies stay valid).
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'current_role_value', 'is_admin', 'is_super_admin',
        'is_staff', 'is_department_member'
      )
  loop
    execute format('alter function %s set schema private', r.sig);
  end loop;
end $$;

-- 2. Fix the helper bodies that referenced public.current_role_value().
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select coalesce(private.current_role_value() in ('admin', 'super_admin'), false);
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select coalesce(private.current_role_value() = 'super_admin', false);
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select coalesce(private.current_role_value() in ('trainer', 'admin', 'super_admin'), false);
$$;

-- 3. Re-assert EXECUTE so RLS can still call them (not exposed as RPC: PostgREST
--    does not scan the private schema).
grant execute on function private.current_role_value() to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_super_admin() to anon, authenticated;
grant execute on function private.is_staff() to anon, authenticated;
grant execute on function private.is_department_member(uuid) to anon, authenticated;

-- 4. Move pg_net out of public (extension_in_public). Guarded.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_net') then
    create schema if not exists extensions;
    alter extension pg_net set schema extensions;
  end if;
exception
  when others then
    raise notice 'Could not move pg_net (%): move it from the dashboard if needed.', sqlerrm;
end $$;

-- Intentionally left exposed (real features depend on them, callers are guarded):
--   verify_certificate(uuid)      public certificate verification page (anon)
--   increment_blog_views(text)    public blog view counter (anon)
--   set_user_verification(...)    super-admin action; body enforces the role
-- Dismiss these in the advisor.
--
-- Not fixable in SQL: enable "Leaked password protection" in the dashboard
-- (Authentication -> Sign In / Providers -> Password).
