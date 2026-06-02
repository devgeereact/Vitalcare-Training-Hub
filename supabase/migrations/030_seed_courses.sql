-- 030_seed_courses.sql
-- Four editable demo courses so the catalogue, cards and "About course"
-- pages have real, published content out of the box. Idempotent by slug;
-- edit freely in the Course Builder afterwards.

insert into courses (title, slug, summary, description, category_id, is_cstf_aligned, cpd_hours, duration_mins, is_published, thumbnail_url)
select v.title, v.slug, v.summary, v.description, v.category_id, v.cstf, v.cpd, v.dur, true, v.thumb
from (values
  ('Moving and Handling People','moving-and-handling-people',
   'Safe moving and handling techniques for care settings, aligned to CSTF.',
   'This course covers safe moving and handling of people and loads in health and care settings. Learners practise risk assessment, safe technique and the correct use of equipment, in line with the Care Certificate and CSTF.',
   '01', true, 4, 180,
   'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=60'),
  ('Safeguarding Adults Level 2','safeguarding-adults-level-2',
   'Recognise, respond to and report abuse and neglect of adults at risk.',
   'A CSTF-aligned safeguarding course for staff who work with adults at risk. Covers types of abuse, signs and indicators, the duty to report, and local safeguarding procedures.',
   '03', true, 3, 150,
   'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=800&q=60'),
  ('Basic Life Support and First Aid','basic-life-support-first-aid',
   'CPR, choking and emergency first aid for health and care staff.',
   'Hands-on emergency first aid and basic life support, including adult CPR, recovery position, choking and the use of an AED. Suitable for all care staff.',
   '10', true, 6, 240,
   'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&w=800&q=60'),
  ('Safe Administration of Medication','safe-administration-of-medication',
   'Principles and practice of safe medication administration in care.',
   'Covers the safe handling, storage, administration and recording of medicines in care settings, including the six rights of administration and error reporting.',
   '04', true, 5, 210,
   'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=800&q=60')
) as v(title, slug, summary, description, category_id, cstf, cpd, dur, thumb)
where not exists (select 1 from courses c where c.slug = v.slug);
