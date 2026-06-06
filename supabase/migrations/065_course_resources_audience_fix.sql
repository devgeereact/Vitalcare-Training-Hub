-- 065_course_resources_audience_fix.sql
-- SECURITY FIX for migration 034.
--
-- The original course_resources_read policy used
--   audience in ('learner', 'trainer', 'both')
-- which lists every value of the resource_audience enum and therefore imposes
-- no restriction at all. A learner could read a 'trainer'-audience resource
-- (for example the Trainer Workbook) directly over the REST API; only the
-- client-side filter in useMyResources hid it. This rewrites the learner-facing
-- read policy so that:
--   1. Learners see 'learner' and 'both' only, never 'trainer'.
--   2. Course-scoped resources are visible only to learners enrolled on that
--      course (global resources, course_id null, stay visible to all learners).
--   3. Targeted per-learner allocations still apply.
-- Staff and trainers are unaffected: they keep full read/write through the
-- existing course_resources_staff_all policy, so trainers still see the
-- Trainer Workbook.

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
          and e.learner_id = auth.uid()
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
          and ra.learner_id = auth.uid()
      )
    )
  );
