-- Chat: let any signed-in user reach an admin for support.
-- profiles RLS only lets a learner read their own row (id = auth.uid() or
-- is_staff()), so learners cannot list admins or see their names client-side.
-- This security-definer function exposes ONLY the minimal admin contact card
-- (id, display name, role) so the messages page can offer a quick chat with an
-- admin. It never exposes emails or other profile fields.
-- Deploy: supabase db push

create or replace function public.list_admin_contacts()
returns table (id uuid, name text, role text)
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
    p.role
  from public.profiles p
  where p.role in ('admin', 'super_admin')
    and p.deleted_at is null
    and p.id <> auth.uid()
  order by name;
$$;

-- Postgres grants EXECUTE to PUBLIC by default; lock it to signed-in users only.
revoke execute on function public.list_admin_contacts() from public;
grant execute on function public.list_admin_contacts() to authenticated;
