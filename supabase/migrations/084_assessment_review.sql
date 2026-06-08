-- Assessment review: let a learner see the questions with the correct answers
-- and their own selections AFTER they have attempted the assessment. The answer
-- key stays hidden during the quiz (migration 077 + get_question_options); this
-- definer function reveals it only to staff, or to a learner who has an attempt.
-- Deploy: supabase db push

create or replace function public.get_assessment_review(p_assessment uuid)
returns table (
  question_id   uuid,
  prompt        text,
  q_position    integer,
  q_type        text,
  option_id     uuid,
  option_label  text,
  is_correct    boolean,
  o_position    integer,
  selected      boolean
)
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  v_attempt uuid;
begin
  -- Gate: staff see any review; a learner needs an attempt on this assessment.
  if not private.is_staff() then
    select id into v_attempt
    from public.assessment_attempts
    where assessment_id = p_assessment
      and learner_id = auth.uid()
      and deleted_at is null
    order by created_at desc
    limit 1;
    if v_attempt is null then
      return;
    end if;
  end if;

  return query
    select
      q.id,
      q.prompt,
      q.position,
      q.type::text,
      o.id,
      o.label,
      o.is_correct,
      o.position,
      (v_attempt is not null and exists (
        select 1 from public.attempt_answers aa
        where aa.attempt_id = v_attempt
          and aa.question_id = q.id
          and o.id::text = any(string_to_array(coalesce(aa.response, ''), ','))
      ))
    from public.questions q
    join public.question_options o
      on o.question_id = q.id and o.deleted_at is null
    where q.assessment_id = p_assessment
      and q.deleted_at is null
    order by q.position, o.position;
end;
$$;

revoke execute on function public.get_assessment_review(uuid) from public;
grant execute on function public.get_assessment_review(uuid) to authenticated;
