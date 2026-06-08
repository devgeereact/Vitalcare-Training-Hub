-- Let learners find an admin to message by email as well as name. Adds the email
-- to the admin contact card. Only admin / super_admin contact details are
-- exposed, and only to signed-in users, so support is reachable without opening
-- the wider directory.
-- Deploy: supabase db push

-- Return type changes (new column), so drop then recreate.
drop function if exists public.list_admin_contacts();

create or replace function public.list_admin_contacts()
returns table (id uuid, name text, email text, role text)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(
      nullif(p.full_name, ''),
      nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
      'Vitalcare Admin'
    ) as name,
    p.email,
    p.role
  from public.profiles p
  where p.role in ('admin', 'super_admin')
    and p.deleted_at is null
    and p.id <> auth.uid()
  order by name;
$$;

revoke execute on function public.list_admin_contacts() from public;
grant execute on function public.list_admin_contacts() to authenticated;
