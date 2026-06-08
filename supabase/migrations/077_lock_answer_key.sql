-- Security: the quiz answer key (question_options.is_correct) must not be
-- readable by learners. The app reads options through get_question_options
-- (migration 068), a security-definer RPC that masks is_correct for non-staff,
-- but the table itself was still directly readable by any authenticated user
-- (options_read used `auth.uid() is not null`). A learner could therefore query
-- the answer key straight from the REST API
-- (/rest/v1/question_options?select=is_correct).
--
-- Restrict direct table reads to staff. Learners keep working: the take-quiz
-- flow reads labels through get_question_options (masked), and grading is
-- server-side in submit_assessment_attempt, so nothing learner-facing needs the
-- raw column. The course/quiz builder (staff) still reads the table directly.
-- Deploy: supabase db push

drop policy if exists options_read on public.question_options;
create policy options_read on public.question_options for select
  using (private.is_staff());
