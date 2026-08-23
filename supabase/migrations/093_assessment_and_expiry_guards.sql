-- 093_assessment_and_expiry_guards.sql
--
-- Deploy: supabase db push
--
-- Two gaps the automated journey test exposed.
--
-- 1. submit_assessment_attempt enforced neither enrolment nor the attempt cap.
--    The take-assessment page blocks a learner once max_attempts is reached,
--    but the page is not the control: anyone can call the RPC directly and keep
--    resitting until they pass, or sit an assessment for a course they were
--    never enrolled on. An assessment that can be retried without limit is not
--    an assessment.
--
-- 2. issue_course_certificate never set expires_at, so every certificate issued
--    by completing a course had no expiry at all. courses.renewal_months exists
--    and the daily expiry-alert job reads expires_at, so the whole renewal
--    chain silently did nothing: no reminder, no expiry, and a CSTF refresh
--    that nobody is told about.

-- ===========================================================================
-- 1. Assessment attempts: enrolled, and inside the cap
-- ===========================================================================

create or replace function public.submit_assessment_attempt(
  p_assessment uuid,
  p_answers jsonb,
  p_time_taken int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid         uuid := auth.uid();
  v_pass_mark   int;
  v_max         int;
  v_course      uuid;
  v_used        int;
  v_total       int := 0;
  v_earned      int := 0;
  v_has_essay   boolean := false;
  v_score       int;
  v_passed      boolean;
  v_attempt     uuid;
  q             record;
  v_correct     boolean;
  v_chosen      text[];
  v_correct_ids text[];
  v_given       text;
  v_response    text;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select pass_mark, max_attempts, course_id
    into v_pass_mark, v_max, v_course
  from public.assessments
  where id = p_assessment and is_published = true and deleted_at is null;
  if v_pass_mark is null then
    raise exception 'Assessment not found' using errcode = 'P0002';
  end if;

  -- Enrolment. A course-linked assessment belongs to the people taking that
  -- course; staff may sit one to check it, and a standalone assessment (no
  -- course) stays open. Staff attempts are still recorded as attempts, which
  -- is why the platform offers a preview mode that records nothing.
  if v_course is not null
     and not private.is_staff()
     and not exists (
       select 1 from public.enrollments
       where course_id = v_course and learner_id = v_uid and deleted_at is null
     ) then
    raise exception 'You are not enrolled on this course' using errcode = '42501';
  end if;

  -- Attempt cap. Zero and null both mean unlimited, matching the UI.
  if coalesce(v_max, 0) > 0 then
    select count(*) into v_used
    from public.assessment_attempts
    where assessment_id = p_assessment and learner_id = v_uid and deleted_at is null;
    if v_used >= v_max then
      raise exception 'You have used all % attempts for this assessment', v_max
        using errcode = '42501';
    end if;
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
        where question_id = q.id and is_correct = true and deleted_at is null;

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
      v_given := lower(trim(coalesce(p_answers -> q.id::text ->> 'textResponse', '')));
      v_correct := v_given <> '' and exists (
        select 1 from public.question_options
        where question_id = q.id
          and deleted_at is null
          and lower(trim(label)) = v_given
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

-- ===========================================================================
-- 2. Certificates expire when the course says they do
-- ===========================================================================

create or replace function public.issue_course_certificate(p_course uuid)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid      uuid := auth.uid();
  v_total    integer;
  v_done     integer;
  v_assess   uuid;
  v_passed   integer;
  v_existing uuid;
  v_cpd      numeric;
  v_renewal  integer;
  v_expires  timestamptz;
  v_cert     uuid;
begin
  if v_uid is null then
    return null;
  end if;

  if not exists (
    select 1 from public.enrollments
    where course_id = p_course and learner_id = v_uid and deleted_at is null
  ) then
    return null;
  end if;

  select count(*) into v_total
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course
    and l.deleted_at is null
    and m.deleted_at is null;
  if v_total = 0 then
    return null;
  end if;

  select count(*) into v_done
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course
    and lp.learner_id = v_uid
    and lp.completed = true
    and l.deleted_at is null
    and m.deleted_at is null;
  if v_done < v_total then
    return null;
  end if;

  select id into v_assess
  from public.assessments
  where course_id = p_course and is_published = true and deleted_at is null
  limit 1;
  if v_assess is not null then
    select count(*) into v_passed
    from public.assessment_attempts
    where assessment_id = v_assess and learner_id = v_uid and passed = true;
    if v_passed = 0 then
      return null;
    end if;
  end if;

  select cpd_hours, renewal_months into v_cpd, v_renewal
  from public.courses where id = p_course;

  -- An expiry only exists if the course defines a renewal period. Without this
  -- the daily expiry-alert job had nothing to find, so nobody was ever told to
  -- refresh a certificate.
  v_expires := case
    when coalesce(v_renewal, 0) > 0 then now() + (v_renewal || ' months')::interval
    else null
  end;

  insert into public.learner_certificates (learner_id, course_id, cpd_hours, expires_at)
  values (v_uid, p_course, coalesce(v_cpd, 0), v_expires)
  on conflict do nothing
  returning id into v_cert;

  if v_cert is not null then
    return v_cert;
  end if;

  select id into v_existing
  from public.learner_certificates
  where learner_id = v_uid and course_id = p_course and deleted_at is null
  limit 1;
  return v_existing;
end;
$$;

revoke execute on function public.issue_course_certificate(uuid) from anon;
grant execute on function public.issue_course_certificate(uuid) to authenticated;

-- Existing certificates issued before this fix have no expiry. Give them one
-- where their course defines a renewal period, measured from issue, so the
-- renewal chain covers the records already in the register.
update public.learner_certificates lc
set expires_at = lc.issued_at + (c.renewal_months || ' months')::interval
from public.courses c
where c.id = lc.course_id
  and lc.expires_at is null
  and lc.deleted_at is null
  and coalesce(c.renewal_months, 0) > 0;
