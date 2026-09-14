-- 096_enrolled_course_visibility.sql
--
-- Deploy: supabase db push
--
-- A learner enrolled on a course that is not published could not see it.
--
-- `courses_read` allowed `is_published or private.is_staff()`, so unpublishing
-- a course took it away from everyone already enrolled on it: gone from "My
-- learning", and its overview page empty, with no explanation. The enrolment,
-- the lesson progress and the assessment attempts all survived. Only the thing
-- they were attached to disappeared.
--
-- That happens on the ordinary path. A course is withdrawn from sale, or sold
-- to one employer before it goes into the public catalogue, and the people who
-- paid for it lose the training.
--
-- Withdrawal has a designed route, `archive_course` from migration 092, which
-- checks what a course is entangled with first. Unpublishing is a catalogue
-- decision, and should not be a revocation.
--
-- This does not widen anything else: a course that is neither published nor
-- one you are enrolled on stays invisible.

drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses for select
  using (
    is_published
    or private.is_staff()
    or exists (
      select 1 from public.enrollments e
      where e.course_id = courses.id
        and e.learner_id = (select auth.uid())
        and e.deleted_at is null
    )
  );
