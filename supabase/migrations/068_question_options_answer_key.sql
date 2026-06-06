-- 068_question_options_answer_key.sql
-- SECURITY FIX for migration 002.
--
-- question_options.options_read was `using (auth.uid() is not null)`, exposing
-- the is_correct column to every authenticated learner. A learner could read
-- the answer key over REST before submitting, defeating the server-side
-- grading added in 063. Grading already happens server-side in
-- submit_assessment_attempt (SECURITY DEFINER, reads as owner), so the client
-- never needs is_correct except in the staff Quiz Builder.
--
-- Fix: restrict direct SELECT on the table to staff, and serve options to
-- everyone through a SECURITY DEFINER function that masks is_correct for
-- non-staff. Both the builder and the take page read through this function.

-- 1. Direct table reads: staff only.
drop policy if exists options_read on public.question_options;
create policy options_read on public.question_options for select
  using (private.is_staff());

-- 2. Masked reader for the client. Staff see the real answer key; everyone
--    else gets is_correct = false.
create or replace function public.get_question_options(p_assessment uuid)
returns table (
  id          uuid,
  question_id uuid,
  label       text,
  position    integer,
  is_correct  boolean
)
language sql
stable
security definer
set search_path = public, private
as $$
  select o.id,
         o.question_id,
         o.label,
         o.position,
         case when private.is_staff() then o.is_correct else false end as is_correct
  from public.question_options o
  join public.questions q on q.id = o.question_id
  where q.assessment_id = p_assessment
    and o.deleted_at is null
  order by o.position;
$$;

revoke execute on function public.get_question_options(uuid) from anon;
grant execute on function public.get_question_options(uuid) to authenticated;
