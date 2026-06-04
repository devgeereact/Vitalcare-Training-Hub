-- 052_staff_verification.sql
-- Verification badge for staff and authorised trainers.
-- Only super admins may set or clear verification. The state is stored on the
-- profile so it persists and can drive a badge across the platform.

-- 1. Columns on profiles ------------------------------------------------------
alter table public.profiles
  add column if not exists is_verified boolean not null default false,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references public.profiles (id);

-- 2. Super-admin-only setter --------------------------------------------------
-- SECURITY DEFINER so the function can update the column under controlled rules
-- while normal row-level update policies still block direct column writes.
create or replace function public.set_user_verification(
  target_id uuid,
  make_verified boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  select role into caller_role from public.profiles where id = auth.uid();

  if caller_role is distinct from 'super_admin' then
    raise exception 'Only a super admin may change verification';
  end if;

  update public.profiles
  set
    is_verified = make_verified,
    verified_at = case when make_verified then now() else null end,
    verified_by = case when make_verified then auth.uid() else null end
  where id = target_id;
end;
$$;

revoke all on function public.set_user_verification(uuid, boolean) from public;
grant execute on function public.set_user_verification(uuid, boolean) to authenticated;
