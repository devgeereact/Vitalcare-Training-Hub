-- 041_profile_banner.sql
-- Adds a cover banner image and a job title to user profiles so the standalone
-- profile page can show a richer header. Idempotent.
-- RLS is already enforced on public.profiles (profiles_update_own lets a user
-- update their own row), so these columns inherit the existing policies.

alter table public.profiles
  add column if not exists banner_url text,
  add column if not exists job_title text;

comment on column public.profiles.banner_url is
  'Public URL of the user-uploaded cover banner image (course-media bucket).';
comment on column public.profiles.job_title is
  'Free-text job title / position shown on the profile header.';
