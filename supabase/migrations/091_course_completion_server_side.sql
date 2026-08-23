-- 091_course_completion_server_side.sql
-- Course completion and certificate issuance stop depending on the browser.
--
-- Until now the only code that could complete an enrolment or issue a
-- certificate was the "mark lesson complete" mutation in the app: it counted
-- lessons, updated the enrolment, then called issue_course_certificate. Two
-- ways a learner lost their certificate:
--
--   1. A learner who finished the lessons before passing a gating assessment
--      never got one at all. Passing an assessment ran no completion logic, and
--      the lesson path could not run again because every lesson was already
--      marked complete. The enrolment sat at 100% and "in_progress" forever.
--   2. The app called issue_course_certificate with a detached `supabase.rpc`,
--      which threw in the browser before any request was sent, so on a course
--      with no assessment the enrolment reached "completed" and no certificate
--      row was ever written. That call is fixed app-side (src/lib/supabase/
--      rpc.ts), but nothing about a certificate should depend on the browser
--      finishing a four-call chain.
--
-- sync_course_completion moves the whole decision into the database, where it
-- re-checks the same conditions issue_course_certificate does. Triggers on
-- lesson_progress and assessment_attempts call it, so whichever of the two
-- finishes last, the enrolment closes and the certificate is written.
--
-- Deploy: supabase db push

create or replace function public.sync_course_completion(
  p_course  uuid,
  p_learner uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total  integer;
  v_done   integer;
  v_pct    integer;
  v_assess uuid;
  v_passed integer;
  v_ready  boolean;
  v_status enrollment_status;
  v_cpd    numeric;
begin
  if p_course is null or p_learner is null then
    return;
  end if;

  -- Only ever touches an existing, live enrolment. Nothing here enrols anyone.
  if not exists (
    select 1 from public.enrollments
    where course_id = p_course and learner_id = p_learner and deleted_at is null
  ) then
    return;
  end if;

  select count(*) into v_total
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course
    and l.deleted_at is null
    and m.deleted_at is null;

  select count(*) into v_done
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course
    and lp.learner_id = p_learner
    and lp.completed = true
    and l.deleted_at is null
    and m.deleted_at is null;

  v_pct := case
             when v_total = 0 then 0
             else least(100, round(v_done::numeric * 100 / v_total))::integer
           end;

  v_ready := v_total > 0 and v_done >= v_total;

  -- A published assessment, if present, must be passed as well.
  if v_ready then
    select id into v_assess
    from public.assessments
    where course_id = p_course and is_published = true and deleted_at is null
    limit 1;
    if v_assess is not null then
      select count(*) into v_passed
      from public.assessment_attempts
      where assessment_id = v_assess
        and learner_id = p_learner
        and passed = true;
      v_ready := v_passed > 0;
    end if;
  end if;

  v_status := case
                when v_ready then 'completed'::enrollment_status
                when v_done > 0 then 'in_progress'::enrollment_status
                else 'not_started'::enrollment_status
              end;

  update public.enrollments
  set progress_pct = v_pct,
      status       = v_status,
      completed_at = case when v_ready then coalesce(completed_at, now()) else null end,
      updated_at   = now()
  where course_id = p_course
    and learner_id = p_learner
    and deleted_at is null
    and (progress_pct is distinct from v_pct or status is distinct from v_status);

  if not v_ready then
    return;
  end if;

  -- Idempotent: one certificate per learner per course. It is created
  -- unapproved, exactly as issue_course_certificate creates it, so the admin
  -- approval step in 083 still applies.
  if exists (
    select 1 from public.learner_certificates
    where learner_id = p_learner and course_id = p_course and deleted_at is null
  ) then
    return;
  end if;

  select cpd_hours into v_cpd from public.courses where id = p_course;
  insert into public.learner_certificates (learner_id, course_id, cpd_hours)
  values (p_learner, p_course, coalesce(v_cpd, 0));
end;
$$;

-- Only the triggers below call this; no client ever needs to.
revoke execute on function public.sync_course_completion(uuid, uuid) from public, anon, authenticated;

-- Completing a lesson may finish the course.
create or replace function public.on_lesson_progress_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_course uuid;
begin
  select m.course_id into v_course
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where l.id = new.lesson_id;

  perform public.sync_course_completion(v_course, new.learner_id);
  return null;
end;
$$;

drop trigger if exists trg_lesson_progress_completion on public.lesson_progress;
create trigger trg_lesson_progress_completion
  after insert or update on public.lesson_progress
  for each row execute function public.on_lesson_progress_change();

-- Passing the gating assessment may finish the course.
create or replace function public.on_assessment_attempt_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_course uuid;
begin
  if new.passed is not true then
    return null;
  end if;

  select course_id into v_course
  from public.assessments
  where id = new.assessment_id;

  perform public.sync_course_completion(v_course, new.learner_id);
  return null;
end;
$$;

drop trigger if exists trg_assessment_attempt_completion on public.assessment_attempts;
create trigger trg_assessment_attempt_completion
  after insert or update on public.assessment_attempts
  for each row execute function public.on_assessment_attempt_change();

-- The completion notification fired on progress reaching 100%, so a learner on
-- a course that gates on an assessment was told "Course completed. Well done."
-- while the enrolment was still in progress and no certificate existed. Fire it
-- on the status the rest of the system treats as authoritative instead.
create or replace function public.notify_on_completion()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    select title into v_title from public.courses where id = new.course_id;
    insert into public.notifications (user_id, type, title, body, link)
    values (new.learner_id, 'info', 'Course completed',
      coalesce(v_title, 'Your course') || ' is complete. Well done.',
      '/platform/courses/' || new.course_id);
  end if;
  return new;
end; $$;

-- Backfill: every learner who already finished the work but holds no
-- certificate because of the two paths above.
do $$
declare r record;
begin
  for r in
    select e.course_id, e.learner_id
    from public.enrollments e
    where e.deleted_at is null
  loop
    perform public.sync_course_completion(r.course_id, r.learner_id);
  end loop;
end $$;
