-- 069_issue_course_certificate.sql
-- Server-side, validated certificate issuance.
--
-- Certificates were inserted from the browser as the learner, but
-- learner_certificates RLS (certs_write) is staff-only, so the insert was
-- silently rejected: the UI said "certificate issued" while no row was created.
-- This SECURITY DEFINER function issues the certificate after re-checking, on
-- the server, that the caller is enrolled, has completed every lesson, and has
-- passed the published assessment (if any). It is idempotent and returns the
-- certificate id (existing or new), or null if the conditions are not met.

create or replace function public.issue_course_certificate(p_course uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_total    integer;
  v_done     integer;
  v_assess   uuid;
  v_passed   integer;
  v_existing uuid;
  v_cpd      numeric;
  v_cert     uuid;
begin
  if v_uid is null then
    return null;
  end if;

  -- Must be enrolled on the course.
  if not exists (
    select 1 from public.enrollments
    where course_id = p_course and learner_id = v_uid and deleted_at is null
  ) then
    return null;
  end if;

  -- Every lesson in the course must be completed.
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

  -- A published assessment, if present, must be passed.
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

  -- Idempotent: return the existing certificate if one exists.
  select id into v_existing
  from public.learner_certificates
  where learner_id = v_uid and course_id = p_course and deleted_at is null
  limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  select cpd_hours into v_cpd from public.courses where id = p_course;
  insert into public.learner_certificates (learner_id, course_id, cpd_hours)
  values (v_uid, p_course, coalesce(v_cpd, 0))
  returning id into v_cert;
  return v_cert;
end;
$$;

revoke execute on function public.issue_course_certificate(uuid) from anon;
grant execute on function public.issue_course_certificate(uuid) to authenticated;
