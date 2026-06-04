-- 053_security_lints.sql
-- Resolve Supabase database linter security warnings.
-- Safe to run more than once. Name-based DO blocks skip anything not present.

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Pin search_path on flagged functions (function_search_path_mutable).
--    A mutable search_path lets a caller shadow objects the function relies on.
-- ───────────────────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'set_updated_at',
        'profile_is_complete',
        'touch_updated_at',
        'touch_department_task'
      )
  loop
    execute format('alter function %s set search_path = public, pg_catalog', r.sig);
  end loop;
end $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Trigger functions must not be callable over the REST API
--    (anon/authenticated_security_definer_function_executable).
--    They fire from triggers regardless of EXECUTE grants, so revoking the
--    public/anon/authenticated grant removes the /rpc/* exposure with no
--    functional change.
-- ───────────────────────────────────────────────────────────────────────────
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'set_updated_at',
        'touch_updated_at',
        'touch_department_task',
        'handle_new_user',
        'notify_on_booking',
        'notify_on_certificate',
        'notify_on_enrolment',
        'notify_expiring_certificates',
        'push_on_notification'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;

-- set_user_verification is meant for signed-in super admins only (the body
-- enforces the role). Keep authenticated, drop the anon exposure.
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_user_verification'
  ) then
    execute 'revoke execute on function public.set_user_verification(uuid, boolean) from anon';
  end if;
end $$;

-- Intentionally left public: verify_certificate (public certificate check) and
-- increment_blog_views (public blog view counter). RLS helper functions
-- (is_admin, is_staff, is_super_admin, is_department_member, current_role_value)
-- are called inside RLS policies and must keep EXECUTE, so they are not revoked.

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Public buckets should not allow listing every object
--    (public_bucket_allows_listing). Object access uses the public URL, which
--    does not need a SELECT policy; only `.list()` does, and the app never
--    lists these buckets. Drop the broad read policies.
-- ───────────────────────────────────────────────────────────────────────────
drop policy if exists "cert_sig_read" on storage.objects;
drop policy if exists "course_media_read" on storage.objects;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Tighten the always-true feedback INSERT policy (rls_policy_always_true).
--    Feedback is only submitted from the authenticated platform, so require a
--    signed-in user instead of WITH CHECK (true).
-- ───────────────────────────────────────────────────────────────────────────
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'feedback_responses'
      and policyname = 'feedback_insert'
  ) then
    execute 'drop policy "feedback_insert" on public.feedback_responses';
  end if;
end $$;

create policy "feedback_insert" on public.feedback_responses
  for insert to authenticated
  with check (auth.uid() is not null);
