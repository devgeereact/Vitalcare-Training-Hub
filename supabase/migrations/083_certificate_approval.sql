-- Certificate approval. When a learner completes and passes a course a
-- certificate row is created, but it now waits for an admin to approve it before
-- it counts as issued. Learners see it as pending; verification only passes once
-- approved; the notification fires on approval, not on creation.
-- Deploy: supabase db push

alter table public.learner_certificates
  add column if not exists approved boolean not null default false,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id) on delete set null;

-- Existing certificates were already issued, so treat them as approved.
update public.learner_certificates
set approved = true, approved_at = coalesce(approved_at, issued_at)
where approved = false;

-- Verification passes only for approved, in-date, non-deleted certificates.
create or replace function public.verify_certificate(p_code text)
returns table (
  learner_name      text,
  course_title      text,
  cpd_hours         numeric,
  issued_at         timestamptz,
  expires_at        timestamptz,
  verification_code text,
  is_valid          boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.full_name,
    c.title,
    lc.cpd_hours,
    lc.issued_at,
    lc.expires_at,
    lc.verification_code,
    (lc.approved
       and lc.deleted_at is null
       and (lc.expires_at is null or lc.expires_at > now()))
  from public.learner_certificates lc
  join public.profiles p on p.id = lc.learner_id
  left join public.courses c on c.id = lc.course_id
  where (
      upper(lc.verification_code) = upper(trim(p_code))
      or lc.verification_uuid::text = lower(trim(p_code))
    )
    and lc.deleted_at is null;
$$;
revoke execute on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- Admin approves a pending certificate.
create or replace function public.approve_certificate(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_admin() then
    raise exception 'Only admins can approve certificates';
  end if;
  update public.learner_certificates
  set approved = true, approved_at = now(), approved_by = auth.uid()
  where id = p_id and approved = false and deleted_at is null;
end;
$$;
revoke execute on function public.approve_certificate(uuid) from public;
grant execute on function public.approve_certificate(uuid) to authenticated;

-- Notify the learner when the certificate is approved (not when it is created).
create or replace function public.notify_on_certificate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  course_title text;
begin
  if new.approved and (tg_op = 'INSERT' or old.approved is distinct from true) then
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
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_certificate on public.learner_certificates;
create trigger trg_notify_certificate
  after insert or update on public.learner_certificates
  for each row execute function public.notify_on_certificate();
