-- ============================================================================
-- Vitalcare Training Hub — Seed (Phase 3)
-- 15 course categories, subscription plans, dev super_admin account.
-- Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 15 course categories
-- ----------------------------------------------------------------------------
insert into public.course_categories (id, name, slug, course_count) values
  ('01', 'Mandatory Care',                       'mandatory-care',           14),
  ('02', 'Care Skills',                          'care-skills',              17),
  ('03', 'Safeguarding',                         'safeguarding',             19),
  ('04', 'Clinical Care',                        'clinical-care',            20),
  ('05', 'Specialist Care',                      'specialist-care',          16),
  ('06', 'Mental Health',                        'mental-health',            6),
  ('07', 'Health and Safety Essentials',         'health-safety-essentials', 14),
  ('08', 'Health and Safety Train the Trainer',  'health-safety-trainer',    15),
  ('09', 'Care Train the Trainer',               'care-trainer',             20),
  ('10', 'First Aid',                            'first-aid',                9),
  ('11', 'Business Compliance',                  'business-compliance',      9),
  ('12', 'Soft Skills',                          'soft-skills',              9),
  ('13', 'Fire Safety',                          'fire-safety',              2),
  ('14', 'Food Safety',                          'food-safety',              4),
  ('15', 'Education Essentials',                 'education-essentials',     16)
on conflict (id) do update
  set name = excluded.name,
      slug = excluded.slug,
      course_count = excluded.course_count;

-- ----------------------------------------------------------------------------
-- Subscription plans (UI only; Stripe disabled)
-- ----------------------------------------------------------------------------
insert into public.subscription_plans (name, slug, price_pence, interval, features) values
  ('Free',         'free',         0,     'month', '["Up to 5 learners","Core courses"]'),
  ('Starter',      'starter',      9900,  'month', '["Up to 50 learners","All courses","Certificates"]'),
  ('Professional', 'professional', 29900, 'month', '["Up to 250 learners","Virtual sessions","Analytics"]'),
  ('Enterprise',   'enterprise',   0,     'month', '["Unlimited learners","SSO","Dedicated support"]')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Super admin promotion
--
-- This migration used to create `gideon@vitalcare.uk` in `auth.users` with a
-- password written in plain text a few lines above it, in a public repository.
-- Anyone who read the file knew a super_admin password for every environment
-- the migration had ever been applied to. The account creation has been
-- removed; rotate that password in Supabase Auth if it has not been rotated
-- already, because removing it here does not unpublish it from Git history.
--
-- Create accounts through Supabase Auth, or, for an isolated local stack, with
-- `scripts/seed-local-test-data.mjs`. The promotion below then gives the named
-- account its role, and is safe to run on its own.
-- ----------------------------------------------------------------------------

-- Promote by email (safe to run on its own if the user was made via Dashboard)
update public.profiles
  set role = 'super_admin', first_name = 'Gideon', last_name = 'Akinlotan'
  where email = 'gideon@vitalcare.uk';
