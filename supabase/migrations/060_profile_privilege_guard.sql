-- 060_profile_privilege_guard.sql
-- SECURITY: the profiles_update_own RLS policy allows a user to update their own
-- row (WITH CHECK id = auth.uid()). That includes privileged columns, so a
-- learner could self-promote (set role = 'super_admin') or fake a verified
-- badge (set is_verified = true) with a direct REST update.
--
-- RLS cannot compare the old vs new row, so guard the privileged columns with a
-- BEFORE UPDATE trigger:
--   • super_admin: may change anything
--   • admin/manager (is_admin): may change role and organisation, but NOT
--     verification (that stays super-admin-only, matching set_user_verification)
--   • everyone else: may not change role, organisation or verification
-- Normal self-service edits (name, phone, about, avatar, social links) are
-- unaffected.

create or replace function public.guard_profile_privileged_cols()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  -- Super admins can change anything.
  if private.is_super_admin() then
    return new;
  end if;

  -- Admins/managers may change role and organisation, but not verification.
  if private.is_admin() then
    if new.is_verified is distinct from old.is_verified
       or new.verified_at is distinct from old.verified_at
       or new.verified_by is distinct from old.verified_by then
      raise exception 'Only a super admin may change verification';
    end if;
    return new;
  end if;

  -- Everyone else: privileged columns must not change.
  if new.role is distinct from old.role
     or new.is_verified is distinct from old.is_verified
     or new.verified_at is distinct from old.verified_at
     or new.verified_by is distinct from old.verified_by
     or new.organisation_id is distinct from old.organisation_id then
    raise exception 'Not allowed to change privileged profile fields';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_privileged_cols on public.profiles;
create trigger guard_profile_privileged_cols
  before update on public.profiles
  for each row
  execute function public.guard_profile_privileged_cols();

-- Trigger function fires from the trigger, never as RPC.
revoke all on function public.guard_profile_privileged_cols()
  from public, anon, authenticated;
