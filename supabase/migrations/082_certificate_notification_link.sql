-- Certificate notification: link straight to the learner's certificates, not the
-- public verification page, and drop the em dash from the body (house style).
-- Deploy: supabase db push

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
    'Your certificate for ' || coalesce(course_title, 'your course') ||
      ' is ready. Download it from your certificates.',
    '/platform/certificates'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_certificate on public.learner_certificates;
create trigger trg_notify_certificate
  after insert on public.learner_certificates
  for each row execute function public.notify_on_certificate();
