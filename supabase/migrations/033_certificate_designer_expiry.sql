-- ============================================================================
-- Vitalcare Training Hub — Certificate template designer + expiry alerts
-- Phase: Certificates (Module 09)
--
-- 1. Section fields on certificate_templates so super_admin can design what
--    appears in each part of the certificate (title, recital, accreditation,
--    signatory, signature image, footer). The certificate always carries the
--    Clinical Director sign-off.
-- 2. A public storage bucket for uploaded signature images (staff write only).
-- 3. Expiry monitoring: a dedupe log + a SQL function that inserts a
--    notification for the certificate owner when a certificate is within 30
--    days of expiry, and again on expiry. Scheduled daily via pg_cron. The
--    existing notifications insert trigger (010) fires the web-push.
--
-- is_staff() is defined in 001_schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Template section fields
-- ----------------------------------------------------------------------------
alter table public.certificate_templates
  add column if not exists title_text text not null default 'Certificate of Completion';
alter table public.certificate_templates
  add column if not exists intro_text text not null default 'This is to certify that';
alter table public.certificate_templates
  add column if not exists completion_text text not null default 'has successfully completed';
alter table public.certificate_templates
  add column if not exists accreditation_line text not null
  default 'CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify';
alter table public.certificate_templates
  add column if not exists signatory_name text not null default 'Harni Muharami RN MSc';
alter table public.certificate_templates
  add column if not exists signatory_role text not null default 'Clinical Director';
alter table public.certificate_templates
  add column if not exists signature_image_url text;
alter table public.certificate_templates
  add column if not exists footer_text text not null
  default 'Vitalcare Training Hub Ltd · Company No. 15718997';
alter table public.certificate_templates
  add column if not exists is_default boolean not null default false;

-- At most one default template at a time.
create unique index if not exists certificate_templates_one_default
  on public.certificate_templates (is_default)
  where is_default = true and deleted_at is null;

-- ----------------------------------------------------------------------------
-- 2. Signature image bucket (public read, staff write)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('certificate-signatures', 'certificate-signatures', true)
on conflict (id) do nothing;

drop policy if exists cert_sig_read on storage.objects;
create policy cert_sig_read on storage.objects for select
  using (bucket_id = 'certificate-signatures');

drop policy if exists cert_sig_write on storage.objects;
create policy cert_sig_write on storage.objects for insert
  with check (bucket_id = 'certificate-signatures' and public.is_staff());

drop policy if exists cert_sig_update on storage.objects;
create policy cert_sig_update on storage.objects for update
  using (bucket_id = 'certificate-signatures' and public.is_staff());

drop policy if exists cert_sig_delete on storage.objects;
create policy cert_sig_delete on storage.objects for delete
  using (bucket_id = 'certificate-signatures' and public.is_staff());

-- ----------------------------------------------------------------------------
-- 3. Expiry alerts
-- ----------------------------------------------------------------------------
-- Dedupe log: one alert per certificate per stage. RLS on; staff read only.
create table if not exists public.certificate_expiry_alerts (
  id              uuid primary key default gen_random_uuid(),
  certificate_id  uuid not null references public.learner_certificates (id) on delete cascade,
  stage           text not null check (stage in ('expiring', 'expired')),
  notified_at     timestamptz not null default now(),
  unique (certificate_id, stage)
);
alter table public.certificate_expiry_alerts enable row level security;

drop policy if exists cert_expiry_alerts_select on public.certificate_expiry_alerts;
create policy cert_expiry_alerts_select on public.certificate_expiry_alerts for select
  using (public.is_staff());

-- Scans for certificates within 30 days of expiry (stage 'expiring') and past
-- expiry (stage 'expired'), inserts one notification per owner per stage, and
-- records the alert so it is not repeated. Returns the number created.
create or replace function public.notify_expiring_certificates()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  rec      record;
  created  integer := 0;
  v_course text;
  v_days   integer;
begin
  for rec in
    select
      lc.id,
      lc.learner_id,
      lc.expires_at,
      lc.course_id,
      case when lc.expires_at <= now() then 'expired' else 'expiring' end as stage
    from public.learner_certificates lc
    where lc.deleted_at is null
      and lc.expires_at is not null
      and lc.expires_at <= now() + interval '30 days'
  loop
    if exists (
      select 1 from public.certificate_expiry_alerts a
      where a.certificate_id = rec.id and a.stage = rec.stage
    ) then
      continue;
    end if;

    select c.title into v_course from public.courses c where c.id = rec.course_id;
    v_course := coalesce(v_course, 'your training');

    if rec.stage = 'expired' then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        rec.learner_id,
        'certificate',
        'Certificate expired',
        'Your certificate for ' || v_course
          || ' has expired. Book a refresher to stay compliant.',
        '/platform/certificates'
      );
    else
      v_days := greatest(0, ceil(extract(epoch from (rec.expires_at - now())) / 86400))::integer;
      insert into public.notifications (user_id, type, title, body, link)
      values (
        rec.learner_id,
        'certificate',
        'Certificate expiring soon',
        'Your certificate for ' || v_course || ' expires in ' || v_days
          || ' day' || case when v_days = 1 then '' else 's' end
          || '. Renew it to stay compliant.',
        '/platform/certificates'
      );
    end if;

    insert into public.certificate_expiry_alerts (certificate_id, stage)
    values (rec.id, rec.stage)
    on conflict (certificate_id, stage) do nothing;

    created := created + 1;
  end loop;

  return created;
end;
$$;

-- Daily at 08:00. Re-running this migration is safe; unschedule first.
select cron.unschedule('certificate-expiry-alerts')
  where exists (select 1 from cron.job where jobname = 'certificate-expiry-alerts');
select cron.schedule('certificate-expiry-alerts', '0 8 * * *', $$
  select public.notify_expiring_certificates();
$$);
