-- 049_seed_payroll_audit.sql
-- Editable demo data: four payslips and eight audit-log events. Idempotent;
-- profile-dependent rows no-op until the @vitalcare.uk test accounts exist.

insert into public.payroll (staff_id, staff_name, staff_email, period, period_start, period_end, gross_pence, deductions_pence, net_pence, status, issued_by, paid_at)
select p.id, coalesce(p.full_name, p.email), p.email, v.period, v.pstart::date, v.pend::date,
  v.gross, v.ded, v.gross - v.ded, v.status,
  (select id from public.profiles where role in ('super_admin','admin') order by role limit 1),
  case when v.status='paid' then (v.pend::date + 2) else null end
from (values
  ('trainer@vitalcare.uk','May 2026','2026-05-01','2026-05-31', 320000, 64000, 'paid'),
  ('manager@vitalcare.uk','May 2026','2026-05-01','2026-05-31', 380000, 79000, 'paid'),
  ('trainer@vitalcare.uk','June 2026','2026-06-01','2026-06-30', 320000, 64000, 'approved'),
  ('admin@vitalcare.uk','June 2026','2026-06-01','2026-06-30', 300000, 60000, 'draft')
) v(email, period, pstart, pend, gross, ded, status)
join public.profiles p on p.email=v.email
where not exists (select 1 from public.payroll pr where pr.staff_id=p.id and pr.period=v.period);

insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata, created_at)
select (select id from public.profiles where email=v.email), v.action, v.etype, null, v.meta::jsonb, now()-(v.ago||' hours')::interval
from (values
  ('gideon@vitalcare.uk','auth.login','session','{"demo":true,"ip":"81.2.69.142"}', 26),
  ('admin@vitalcare.uk','course.create','course','{"demo":true,"title":"Safe Administration of Medication"}', 22),
  ('trainer@vitalcare.uk','session.create','training_session','{"demo":true,"title":"Moving and Handling Practical"}', 20),
  ('admin@vitalcare.uk','user.role_update','profile','{"demo":true,"from":"learner","to":"trainer"}', 18),
  ('gideon@vitalcare.uk','certificate.issue','learner_certificate','{"demo":true,"course":"Moving and Handling People"}', 14),
  ('manager@vitalcare.uk','invoice.create','invoice','{"demo":true,"total":"GBP 125.00"}', 9),
  ('admin@vitalcare.uk','payroll.create','payroll','{"demo":true,"period":"June 2026"}', 5),
  ('gideon@vitalcare.uk','settings.update','organisation','{"demo":true,"field":"branding"}', 2)
) v(email, action, etype, meta, ago)
where (select id from public.profiles where email=v.email) is not null
  and not exists (select 1 from public.audit_logs a where a.action=v.action and a.metadata->>'demo'='true');
