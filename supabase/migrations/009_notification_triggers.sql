-- ============================================================================
-- Vitalcare Training Hub — Notification triggers (Phase 10)
-- Auto-create in-app notifications on key learner events. Functions are
-- security definer so they can insert into notifications regardless of RLS.
-- ============================================================================

-- Enrolment -> notify the learner.
create or replace function public.notify_on_enrolment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  course_title text;
begin
  select title into course_title from public.courses where id = new.course_id;
  insert into public.notifications (user_id, type, title, body, link)
  values (
    new.learner_id,
    'enrolment',
    'Enrolled on ' || coalesce(course_title, 'a course'),
    'You have been enrolled. Start learning when you are ready.',
    '/platform/courses/' || new.course_id
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_enrolment on public.enrollments;
create trigger trg_notify_enrolment
  after insert on public.enrollments
  for each row execute function public.notify_on_enrolment();

-- Session booking -> notify the learner.
create or replace function public.notify_on_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s_title text;
  s_start timestamptz;
begin
  select title, starts_at into s_title, s_start
  from public.training_sessions where id = new.session_id;
  insert into public.notifications (user_id, type, title, body, link)
  values (
    new.learner_id,
    'session',
    'Booked: ' || coalesce(s_title, 'a session'),
    case when s_start is not null
         then 'Scheduled for ' || to_char(s_start, 'DD Mon YYYY, HH24:MI')
         else 'Your place is confirmed.' end,
    '/platform/calendar'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_booking on public.session_bookings;
create trigger trg_notify_booking
  after insert on public.session_bookings
  for each row execute function public.notify_on_booking();

-- Certificate issued -> notify the learner.
create or replace function public.notify_on_certificate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  course_title text;
begin
  select title into course_title from public.courses where id = new.course_id;
  insert into public.notifications (user_id, type, title, body, link)
  values (
    new.learner_id,
    'certificate',
    'Certificate issued',
    coalesce(course_title, 'Your course') || ' — verifiable at vitalcare.uk/verify',
    '/resources/verify-certificate'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_certificate on public.learner_certificates;
create trigger trg_notify_certificate
  after insert on public.learner_certificates
  for each row execute function public.notify_on_certificate();
