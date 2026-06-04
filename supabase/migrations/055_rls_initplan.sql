-- 055_rls_initplan.sql
-- Performance advisor: auth_rls_initplan. Wrap auth.uid()/auth.role()/auth.jwt()
-- in a scalar sub-select so Postgres evaluates them once per query instead of
-- once per row.
--
-- This rebuilds each affected policy from its CURRENT live definition
-- (pg_policies), changing only the auth.* calls. Permissive/restrictive, roles,
-- command and the rest of the expression are preserved exactly. The whole block
-- is one statement, so any error rolls everything back — nothing is left
-- half-applied. Review the result with the linter afterwards.
--
-- RECOMMENDED: run on a Supabase branch first if you have one. It is safe to
-- re-run (already-wrapped policies are skipped).

do $$
declare
  r record;
  new_qual text;
  new_check text;
  stmt text;
begin
  for r in
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') ~ 'auth\.(uid|role|jwt)\(\)'
        or coalesce(with_check, '') ~ 'auth\.(uid|role|jwt)\(\)'
      )
      -- Skip anything already wrapped, so the migration is idempotent.
      and coalesce(qual, '') !~ '\(\s*select\s+auth\.'
      and coalesce(with_check, '') !~ '\(\s*select\s+auth\.'
  loop
    new_qual := regexp_replace(r.qual, 'auth\.(uid|role|jwt)\(\)', '(select auth.\1())', 'g');
    new_check := regexp_replace(r.with_check, 'auth\.(uid|role|jwt)\(\)', '(select auth.\1())', 'g');

    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);

    stmt := format(
      'create policy %I on %I.%I as %s for %s to %s',
      r.policyname,
      r.schemaname,
      r.tablename,
      case when r.permissive = 'PERMISSIVE' then 'permissive' else 'restrictive' end,
      r.cmd,
      array_to_string(r.roles, ', ')
    );
    if new_qual is not null then
      stmt := stmt || format(' using (%s)', new_qual);
    end if;
    if new_check is not null then
      stmt := stmt || format(' with check (%s)', new_check);
    end if;

    execute stmt;
  end loop;
end $$;
