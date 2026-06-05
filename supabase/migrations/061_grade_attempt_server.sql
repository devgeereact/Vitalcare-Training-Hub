-- 061_grade_attempt_server.sql
-- SECURITY / integrity: assessment attempts were graded in the browser and
-- inserted directly (attempts_insert_own: learner_id = auth.uid()), so a learner
-- could POST a fake attempt with passed = true and earn a certificate without
-- answering anything. attempts_update also let a learner flip passed on an
-- existing attempt.
--
-- Fix: grade server-side in a SECURITY DEFINER function that owns the only write
-- path, then revoke direct insert/update from clients.

create or replace function public.submit_assessment_attempt(
  p_assessment uuid,
  p_answers jsonb,
  p_time_taken int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_pass_mark  int;
  v_total      int := 0;
  v_earned     int := 0;
  v_has_essay  boolean := false;
  v_score      int;
  v_passed     boolean;
  v_attempt    uuid;
  q            record;
  v_correct    boolean;
  v_chosen     text[];
  v_correct_ids text[];
  v_given      text;
  v_response   text;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  select pass_mark into v_pass_mark
  from public.assessments
  where id = p_assessment and is_published = true and deleted_at is null;
  if v_pass_mark is null then
    raise exception 'Assessment not found';
  end if;

  insert into public.assessment_attempts
    (assessment_id, learner_id, score, passed, time_taken_secs, completed_at)
  values (p_assessment, v_uid, 0, false, p_time_taken, now())
  returning id into v_attempt;

  for q in
    select id, type, points
    from public.questions
    where assessment_id = p_assessment and deleted_at is null
  loop
    v_total := v_total + q.points;

    if q.type = 'free_text' then
      v_has_essay := true;
      v_response := coalesce(p_answers -> q.id::text ->> 'textResponse', '');
      insert into public.attempt_answers (attempt_id, question_id, response, is_correct)
      values (v_attempt, q.id, v_response, null);
      continue;
    end if;

    v_correct := false;

    if q.type in ('mcq', 'true_false') then
      select coalesce(array_agg(id::text order by id::text), '{}')
        into v_correct_ids
        from public.question_options
        where question_id = q.id and is_correct = true;

      select coalesce(array_agg(x order by x), '{}')
        into v_chosen
        from jsonb_array_elements_text(
          coalesce(p_answers -> q.id::text -> 'selectedOptionIds', '[]'::jsonb)
        ) as t(x);

      v_correct := array_length(v_correct_ids, 1) is not null
        and v_correct_ids = v_chosen;

      insert into public.attempt_answers (attempt_id, question_id, response, is_correct)
      values (v_attempt, q.id, array_to_string(v_chosen, ','), v_correct);
    else
      -- fill_blank: case-insensitive match against any option label
      v_given := lower(trim(coalesce(p_answers -> q.id::text ->> 'textResponse', '')));
      v_correct := v_given <> '' and exists (
        select 1 from public.question_options
        where question_id = q.id and lower(trim(label)) = v_given
      );
      insert into public.attempt_answers (attempt_id, question_id, response, is_correct)
      values (v_attempt, q.id, v_given, v_correct);
    end if;

    if v_correct then
      v_earned := v_earned + q.points;
    end if;
  end loop;

  v_score := case when v_total > 0
    then round((v_earned::numeric / v_total) * 100)
    else 0 end;
  v_passed := v_score >= v_pass_mark;

  update public.assessment_attempts
  set score = v_score, passed = v_passed
  where id = v_attempt;

  return jsonb_build_object('score', v_score, 'passed', v_passed, 'autoGraded', not v_has_essay);
end;
$$;

revoke all on function public.submit_assessment_attempt(uuid, jsonb, int) from public;
grant execute on function public.submit_assessment_attempt(uuid, jsonb, int) to authenticated;

-- Only the graded function may create attempts/answers now (it runs as the
-- definer, so it is unaffected by these revokes).
revoke insert on public.assessment_attempts from anon, authenticated;
revoke insert on public.attempt_answers from anon, authenticated;

-- Tighten updates to staff only (e.g. essay grading); a learner can no longer
-- flip passed on their own attempt. The UPDATE grant stays so staff can use it.
drop policy if exists attempts_update on public.assessment_attempts;
create policy attempts_update on public.assessment_attempts for update
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());
