-- 066_course_enrolment_counts.sql
-- Public, aggregate-only enrolment counts per course, for the "Most recommended"
-- (most enrolled) catalogue sort. SECURITY DEFINER so it bypasses the per-row
-- enrollments RLS (a learner can only read their own rows) while exposing only
-- counts, never any learner identity.

create or replace function public.course_enrolment_counts()
returns table (course_id uuid, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  select course_id, count(*)::bigint as total
  from public.enrollments
  where deleted_at is null
  group by course_id;
$$;

grant execute on function public.course_enrolment_counts() to anon, authenticated;
