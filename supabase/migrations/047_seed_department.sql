-- 047_seed_department.sql
-- Editable demo collaboration department + members + a small task board.
-- Ensures one organisation exists (departments.organisation_id is NOT NULL) and
-- links the @vitalcare.uk test profiles to it. Idempotent; profile-dependent
-- inserts no-op until those accounts exist.

insert into public.organisations (name, slug, sector)
select 'Vitalcare Training Hub', 'vitalcare-training-hub', 'Healthcare training'
where not exists (select 1 from public.organisations);

update public.profiles
set organisation_id = (select id from public.organisations order by created_at limit 1)
where organisation_id is null and email like '%@vitalcare.uk';

insert into public.departments (name, description, organisation_id)
select 'Quality & Compliance Project',
  'Cross-team project: refresh the CSTF mandatory training pathway and prepare for the next CQC review. Demo department, editable.',
  (select id from public.organisations order by created_at limit 1)
where not exists (select 1 from public.departments where name='Quality & Compliance Project');

insert into public.department_members (department_id, user_id)
select d.id, p.id
from public.departments d
join public.profiles p on p.email in ('gideon@vitalcare.uk','admin@vitalcare.uk','trainer@vitalcare.uk','manager@vitalcare.uk')
where d.name='Quality & Compliance Project'
  and not exists (select 1 from public.department_members m where m.department_id=d.id and m.user_id=p.id);

insert into public.department_tasks (department_id, title, description, assignee_id, status, due_date, created_by)
select d.id, t.title, t.descr,
  (select id from public.profiles where email=t.assignee),
  t.status, t.due::date,
  (select id from public.profiles where role in ('super_admin','admin') order by role limit 1)
from public.departments d
cross join (values
  ('Audit current CSTF course content','Review all 14 mandatory courses against the latest CSTF framework and flag gaps.','trainer@vitalcare.uk','doing', now()+interval '5 day'),
  ('Update Moving and Handling assessment','Rewrite the assessment to match the revised practical criteria.','trainer@vitalcare.uk','todo', now()+interval '12 day'),
  ('Draft CQC evidence pack','Compile certificates, attendance and policy docs into the evidence pack.','manager@vitalcare.uk','todo', now()+interval '20 day'),
  ('Confirm trainer availability','Collect availability for the rollout sessions in the timetable.','admin@vitalcare.uk','done', now()-interval '2 day'),
  ('Set rollout schedule','Publish the session schedule and notify all learners.','admin@vitalcare.uk','doing', now()+interval '8 day')
) as t(title, descr, assignee, status, due)
where d.name='Quality & Compliance Project'
  and not exists (select 1 from public.department_tasks dt where dt.department_id=d.id);
