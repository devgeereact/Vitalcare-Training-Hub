-- Learners may enrol themselves (insert their own enrollment row).
drop policy if exists enrollments_insert_own on public.enrollments;
create policy enrollments_insert_own on public.enrollments for insert
  with check (learner_id = auth.uid() or public.is_staff());
