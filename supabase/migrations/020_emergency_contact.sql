-- ============================================================================
-- Vitalcare Training Hub — Emergency contact + profile completion (Phase 12)
-- ============================================================================

alter table public.profiles
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text;

-- Helper: a profile is "complete" when name, phone and an emergency contact are
-- all present. Used by the weekly reminder job.
create or replace function public.profile_is_complete(p public.profiles)
returns boolean
language sql
immutable
as $$
  select coalesce(p.first_name, '') <> ''
     and coalesce(p.last_name, '') <> ''
     and coalesce(p.phone, '') <> ''
     and coalesce(p.emergency_contact_name, '') <> ''
     and coalesce(p.emergency_contact_phone, '') <> '';
$$;
