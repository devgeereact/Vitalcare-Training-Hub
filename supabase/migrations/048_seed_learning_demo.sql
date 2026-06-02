-- 048_seed_learning_demo.sql
-- Editable demo data on the Moving & Handling course: a quiz (assessment +
-- mcq questions + options), one completed attempt (assessment report), three
-- resource-library items (learner/trainer/both), a past practical session with
-- an attendance log, and one issued certificate (with a verification code).
-- Idempotent; profile/course-dependent inserts no-op until those rows exist.

insert into public.assessments (course_id, title, description, pass_mark, time_limit_mins, max_attempts, is_published, created_by)
select c.id, 'Moving and Handling Knowledge Check',
  'A short demo quiz checking the key principles of safe moving and handling. Editable.',
  70, 15, 3, true,
  (select id from public.profiles where role in ('super_admin','admin') order by role limit 1)
from public.courses c where c.slug='moving-and-handling-people'
  and not exists (select 1 from public.assessments a where a.title='Moving and Handling Knowledge Check');

with a as (select id from public.assessments where title='Moving and Handling Knowledge Check')
insert into public.questions (assessment_id, type, prompt, points, position)
select a.id, 'mcq'::question_type, q.prompt, 1, q.pos
from a cross join (values
  ('Before any manual handling task you should first:', 1),
  ('The safest lifting posture keeps the load:', 2),
  ('If a transfer feels unsafe you should:', 3)
) as q(prompt, pos)
where not exists (select 1 from public.questions x where x.assessment_id=a.id);

insert into public.question_options (question_id, label, is_correct, position)
select q.id, o.label, o.correct, o.pos
from public.questions q
join public.assessments a on a.id=q.assessment_id and a.title='Moving and Handling Knowledge Check'
join lateral (
  select * from (values
    ('Carry out a risk assessment', true, 1),
    ('Lift as quickly as possible', false, 2),
    ('Ask a colleague to watch', false, 3)
  ) v(label, correct, pos) where q.position=1
  union all select * from (values
    ('Close to your body', true, 1),
    ('At arm''s length', false, 2),
    ('Above shoulder height', false, 3)
  ) v(label, correct, pos) where q.position=2
  union all select * from (values
    ('Stop and seek help or equipment', true, 1),
    ('Continue carefully', false, 2),
    ('Lift with your back', false, 3)
  ) v(label, correct, pos) where q.position=3
) o on true
where not exists (select 1 from public.question_options qo where qo.question_id=q.id);

insert into public.assessment_attempts (assessment_id, learner_id, score, passed, time_taken_secs, completed_at)
select a.id, (select id from public.profiles where email='learner@vitalcare.uk'), 80, true, 540, now()-interval '1 day'
from public.assessments a where a.title='Moving and Handling Knowledge Check'
  and (select id from public.profiles where email='learner@vitalcare.uk') is not null
  and not exists (select 1 from public.assessment_attempts at where at.assessment_id=a.id);

insert into public.course_resources (course_id, title, description, link_url, kind, audience, is_published, created_by)
select c.id, r.title, r.descr, r.link, r.kind, r.aud::resource_audience, true,
  (select id from public.profiles where role in ('super_admin','admin') order by role limit 1)
from public.courses c
cross join (values
  ('Moving and Handling Handbook (PDF)','Learner handbook covering safe technique.','https://www.hse.gov.uk/pubns/indg143.pdf','document','learner'),
  ('Practical Demonstration Video','Step-by-step transfer demonstration.','https://www.youtube.com/watch?v=dummy','video','both'),
  ('Trainer Facilitation Guide','Session plan and assessment notes for trainers.','https://example.com/trainer-guide','document','trainer')
) r(title, descr, link, kind, aud)
where c.slug='moving-and-handling-people'
  and not exists (select 1 from public.course_resources cr where cr.course_id=c.id and cr.title=r.title);

insert into public.training_sessions (title, description, course_id, trainer_id, starts_at, ends_at, venue, is_virtual, is_public)
select 'Moving and Handling Practical (Demo)','Hands-on practical session. Demo for the attendance log.',
  c.id, (select id from public.profiles where email='trainer@vitalcare.uk'),
  now()-interval '1 day', now()-interval '1 day'+interval '2 hour', 'Training Room 1', false, false
from public.courses c where c.slug='moving-and-handling-people'
  and not exists (select 1 from public.training_sessions s where s.title='Moving and Handling Practical (Demo)');

insert into public.attendance_records (session_id, learner_id, status, marked_by, marked_at)
select s.id, p.id, v.status::attendance_status, (select id from public.profiles where email='trainer@vitalcare.uk'), now()-interval '1 day'
from public.training_sessions s
join (values
  ('learner@vitalcare.uk','present'),
  ('gideon@vitalcare.uk','present'),
  ('manager@vitalcare.uk','late'),
  ('content_editor@vitalcare.uk','absent')
) v(email, status) on true
join public.profiles p on p.email=v.email
where s.title='Moving and Handling Practical (Demo)'
  and not exists (select 1 from public.attendance_records ar where ar.session_id=s.id and ar.learner_id=p.id);

insert into public.learner_certificates (learner_id, course_id, cpd_hours, issued_at, expires_at, verification_uuid)
select (select id from public.profiles where email='learner@vitalcare.uk'), c.id, 4,
  now()-interval '2 day', now()+interval '363 day', gen_random_uuid()
from public.courses c where c.slug='moving-and-handling-people'
  and (select id from public.profiles where email='learner@vitalcare.uk') is not null
  and not exists (
    select 1 from public.learner_certificates lc
    where lc.learner_id=(select id from public.profiles where email='learner@vitalcare.uk') and lc.course_id=c.id
  );
