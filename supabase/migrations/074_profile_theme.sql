-- Appearance: persist each user's chosen theme to their profile so it follows
-- them across devices, instead of living only in browser localStorage.
-- Deploy: supabase db push

alter table public.profiles
  add column if not exists theme text;
