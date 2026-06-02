-- 032_seed_dummies.sql
-- Editable demo data: one 1:1 request, one cohort (+member), one learning path
-- (+4 linked courses) and 4 store products. All idempotent and safe to edit or
-- delete. Test user accounts (admin/trainer/learner/manager/content_editor
-- @vitalcare.uk, password Testing123!) are provisioned separately via the Auth
-- admin API, not in SQL, so the profile-dependent inserts below no-op until
-- those accounts exist.

-- Dummy 1:1 request (approved + scheduled)
insert into public.one_to_one_requests (learner_id, course_id, trainer_id, preferred_at, scheduled_at, note, status, meet_url, decided_by, decided_at)
select
  (select id from public.profiles where email='learner@vitalcare.uk'),
  (select id from public.courses where slug='moving-and-handling-people'),
  (select id from public.profiles where email='trainer@vitalcare.uk'),
  now()+interval '2 day', now()+interval '3 day',
  'Testing 1:1: learner needs help with safe transfer technique. Editable demo.', 'approved',
  'https://meet.google.com/demo-vitalcare',
  (select id from public.profiles where role in ('super_admin','admin') order by role limit 1), now()
where (select id from public.profiles where email='learner@vitalcare.uk') is not null
  and (select id from public.profiles where email='trainer@vitalcare.uk') is not null
  and not exists (select 1 from public.one_to_one_requests r where r.note like 'Testing 1:1:%');

-- Dummy cohort + membership
insert into public.cohorts (name, description, created_by)
select 'Testing Cohort 2025', 'Demo cohort for testing. Rename or delete freely.',
  (select id from public.profiles where role in ('super_admin','admin') order by role limit 1)
where not exists (select 1 from public.cohorts where name='Testing Cohort 2025');

insert into public.cohort_members (cohort_id, learner_id)
select c.id, (select id from public.profiles where email='learner@vitalcare.uk')
from public.cohorts c
where c.name='Testing Cohort 2025'
  and (select id from public.profiles where email='learner@vitalcare.uk') is not null
  and not exists (select 1 from public.cohort_members m where m.cohort_id=c.id);

-- Dummy learning path + linked courses
insert into public.learning_paths (name, description, is_published, created_by)
select 'Care Certificate Pathway', 'Demo learning path covering the core induction courses. Editable.', true,
  (select id from public.profiles where role in ('super_admin','admin') order by role limit 1)
where not exists (select 1 from public.learning_paths where name='Care Certificate Pathway');

insert into public.learning_path_courses (path_id, course_id, position)
select p.id, c.id, c.rn
from (select id from public.learning_paths where name='Care Certificate Pathway') p
cross join (
  select id, row_number() over (order by slug) rn from public.courses
  where slug in ('moving-and-handling-people','safeguarding-adults-level-2','basic-life-support-first-aid','safe-administration-of-medication')
) c
where not exists (select 1 from public.learning_path_courses lpc where lpc.path_id=p.id);

-- 4 dummy store products
insert into public.products (name, description, price_pence, is_published)
select * from (values
  ('CSTF Workbook (PDF)', 'Printable CSTF revision workbook. Demo item, editable.', 1500, true),
  ('First Aid Practical Day', 'In-person practical assessment add-on day. Demo item.', 4500, true),
  ('Care Certificate Printed Pack', 'Printed Care Certificate evidence pack posted to you. Demo.', 2500, true),
  ('Trainer Resource Bundle', 'Slide decks, handouts and assessment templates for trainers. Demo.', 9900, true)
) v(name, description, price_pence, is_published)
where not exists (select 1 from public.products where name=v.name);
