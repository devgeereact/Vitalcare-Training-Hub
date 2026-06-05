-- 058_feedback_public_insert.sql
-- Feedback is collected on the public landing pages as well as inside the app,
-- so anyone (anon or authenticated) may submit it. Migration 053 tightened the
-- INSERT policy to authenticated-only, which blocks the public form.
--
-- Re-allow public submission, but require status = 'pending' so a submitter
-- cannot self-approve their own feedback (admins approve it before it shows on
-- the wall). This is not an always-true policy, so it does not re-trigger the
-- permissive-policy advisor warning.

drop policy if exists "feedback_insert" on public.feedback_responses;

create policy "feedback_insert" on public.feedback_responses
  for insert
  to anon, authenticated
  with check (status = 'pending');
