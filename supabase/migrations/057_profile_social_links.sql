-- 057_profile_social_links.sql
-- Social links for the profile. A small jsonb map of platform -> url, edited in
-- Settings and shown on the profile. Follows the existing extras pattern
-- (banner_url, job_title): a real column read through a narrow cast, so the
-- generated database.types.ts does not need editing.

alter table public.profiles
  add column if not exists social_links jsonb not null default '{}'::jsonb;
