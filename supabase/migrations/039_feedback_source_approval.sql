-- 039_feedback_source_approval.sql
-- Source tagging and an admin approval step for feedback. Submissions land as
-- 'pending' and are only shown publicly once an admin approves them.

alter table public.feedback_responses
  add column if not exists source text not null default 'course',
  add column if not exists status text not null default 'pending',
  add column if not exists author_name text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'feedback_source_chk'
  ) then
    alter table public.feedback_responses
      add constraint feedback_source_chk
      check (source in ('website', 'course', 'recommendation'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'feedback_status_chk'
  ) then
    alter table public.feedback_responses
      add constraint feedback_status_chk
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- Anyone (including anonymous website visitors) may submit feedback; it stays
-- pending until approved. Replaces the learner-only insert policy.
drop policy if exists feedback_insert on public.feedback_responses;
create policy feedback_insert on public.feedback_responses
  for insert with check (true);

-- Staff see everything; learners see their own; everyone may read approved
-- feedback (so the public results wall works).
drop policy if exists feedback_select on public.feedback_responses;
create policy feedback_select on public.feedback_responses
  for select using (
    (learner_id = auth.uid()) or public.is_staff() or (status = 'approved')
  );

-- Only staff can approve / reject / edit feedback.
drop policy if exists feedback_update on public.feedback_responses;
create policy feedback_update on public.feedback_responses
  for update using (public.is_staff()) with check (public.is_staff());
