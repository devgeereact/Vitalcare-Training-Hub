-- 006_oauth_profile_names.sql
-- Populate profile names for Google (and other OAuth) sign-ups. Google sends
-- given_name / family_name / name / picture in raw_user_meta_data, not
-- first_name / last_name. Update the trigger + backfill existing rows.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  full_name text := coalesce(meta ->> 'full_name', meta ->> 'name', '');
begin
  insert into public.profiles (id, email, first_name, last_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(
      meta ->> 'first_name',
      meta ->> 'given_name',
      nullif(split_part(full_name, ' ', 1), '')
    ),
    coalesce(
      meta ->> 'last_name',
      meta ->> 'family_name',
      nullif(regexp_replace(full_name, '^\S+\s*', ''), '')
    ),
    coalesce(meta ->> 'avatar_url', meta ->> 'picture'),
    'learner'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Backfill profiles that are missing a name (existing Google sign-ups).
update public.profiles p
set
  first_name = coalesce(
    nullif(p.first_name, ''),
    u.raw_user_meta_data ->> 'given_name',
    nullif(split_part(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), ' ', 1), '')
  ),
  last_name = coalesce(
    nullif(p.last_name, ''),
    u.raw_user_meta_data ->> 'family_name',
    nullif(regexp_replace(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), '^\S+\s*', ''), '')
  ),
  avatar_url = coalesce(p.avatar_url, u.raw_user_meta_data ->> 'picture')
from auth.users u
where u.id = p.id
  and (p.first_name is null or p.first_name = '');
