-- 072_perf_advisor.sql
-- Performance Advisor fixes (the safe, worthwhile ones).
--
-- 1. auth_rls_initplan: course_resources_read called auth.uid() per row. Wrap
--    it in a scalar subquery so Postgres evaluates it once per statement.
-- 2. unindexed_foreign_keys: add covering indexes for three FKs flagged on the
--    staff training tables.
--
-- Intentionally NOT addressed: multiple_permissive_policies (the read + FOR ALL
-- write pattern across all tables; rewriting every table is high risk for
-- negligible gain) and unused_index (the DB is new; those indexes cover FKs and
-- query paths that have not run yet and will be used in production).

-- 1. Re-create the learner read policy with (select auth.uid()).
drop policy if exists course_resources_read on public.course_resources;
create policy course_resources_read on public.course_resources
  for select to authenticated
  using (
    deleted_at is null
    and is_published = true
    and audience in ('learner', 'both')
    and (
      course_id is null
      or exists (
        select 1 from public.enrollments e
        where e.course_id = course_resources.course_id
          and e.learner_id = (select auth.uid())
      )
    )
    and (
      not exists (
        select 1 from public.resource_allocations ra
        where ra.resource_id = course_resources.id
      )
      or exists (
        select 1 from public.resource_allocations ra
        where ra.resource_id = course_resources.id
          and ra.learner_id = (select auth.uid())
      )
    )
  );

-- 2. Covering indexes for the flagged foreign keys.
create index if not exists staff_training_records_certificate_idx
  on public.staff_training_records (certificate_id);
create index if not exists staff_training_records_trainer_idx
  on public.staff_training_records (trainer_id);
create index if not exists staff_training_requirements_department_idx
  on public.staff_training_requirements (department_id);
