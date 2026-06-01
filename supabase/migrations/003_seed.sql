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
-- Dev super_admin account (local development only)
-- Email: gideon@vitalcare.uk  Password: Testing123!
--
-- If your Supabase version rejects direct auth.users inserts, instead create
-- the user in Dashboard > Authentication > Users, then run only the final
-- "promote to super_admin" UPDATE below.
-- ----------------------------------------------------------------------------
do $$
declare
  dev_id uuid;
begin
  select id into dev_id from auth.users where email = 'gideon@vitalcare.uk';

  if dev_id is null then
    dev_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      dev_id,
      'authenticated',
      'authenticated',
      'gideon@vitalcare.uk',
      crypt('Testing123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"Gideon","last_name":"Akinlotan"}',
      now(),
      now()
    );
  end if;

  -- Ensure a profile exists (the on_auth_user_created trigger normally makes it)
  insert into public.profiles (id, email, first_name, last_name, role)
  values (dev_id, 'gideon@vitalcare.uk', 'Gideon', 'Akinlotan', 'super_admin')
  on conflict (id) do update set role = 'super_admin';
end $$;

-- Promote by email (safe to run on its own if the user was made via Dashboard)
update public.profiles
  set role = 'super_admin', first_name = 'Gideon', last_name = 'Akinlotan'
  where email = 'gideon@vitalcare.uk';
