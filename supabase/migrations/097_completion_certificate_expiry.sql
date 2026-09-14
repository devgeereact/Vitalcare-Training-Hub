-- 097_completion_certificate_expiry.sql
--
-- Deploy: supabase db push
--
-- Certificates issued by completing a course still had no expiry, after 093
-- was written to give them one.
--
-- 093 fixed `issue_course_certificate`. It did not fix the other function that
-- creates a certificate. `sync_course_completion`, from 091, fires on a trigger
-- when a lesson is completed or an assessment attempt is recorded, and inserts
-- the certificate itself with cpd_hours and nothing else. That trigger runs
-- first, so by the time `issue_course_certificate` is called it finds an
-- existing row and returns its id. The expiry logic in 093 was never reached on
-- the ordinary path.
--
-- The visible effect: a course with `renewal_months = 12` issued certificates
-- that never expire. No reminder, no renewal, and a compliance register that
-- says everybody is in date for ever. Reproduced in a browser against a course
-- with a twelve-month renewal period, which produced a certificate with
-- `expires_at` null.
--
-- This migration only changes what happens from now on. Certificates already
-- issued without an expiry are left alone **on purpose**: giving one an expiry
-- can make it lapse the instant the statement runs, and the daily alert job
-- emails its holder the next morning. `docs/SQL-EDITOR-RUNBOOK.md` has that
-- backfill with a pre-flight query that shows exactly who it would affect. Run
-- it deliberately, having looked.

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
  v_renewal integer;
  v_expires timestamptz;
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

  select cpd_hours, renewal_months into v_cpd, v_renewal
  from public.courses where id = p_course;

  -- The same rule as issue_course_certificate: an expiry exists only where the
  -- course defines a renewal period. PostgreSQL clamps a month-end date, so 31
  -- January plus one month is 28 February.
  v_expires := case
    when coalesce(v_renewal, 0) > 0 then now() + (v_renewal || ' months')::interval
    else null
  end;

  insert into public.learner_certificates
    (learner_id, course_id, cpd_hours, expires_at)
  values (p_learner, p_course, coalesce(v_cpd, 0), v_expires);
end;
$$;

-- `create or replace` keeps the existing grants, but state them anyway so a
-- fresh database ends up in the same place as an upgraded one. Only the
-- triggers call this; no client ever needs to.
revoke execute on function public.sync_course_completion(uuid, uuid)
  from public, anon, authenticated;
