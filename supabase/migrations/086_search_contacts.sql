-- Contact search for chat. Learners can search staff (admins, managers,
-- trainers, content editors) by name or email and start a chat immediately.
-- profiles RLS hides other users from learners, so this security-definer
-- function does the lookup and returns only the minimal contact card. Learner
-- to learner search is intentionally excluded for privacy.
-- Deploy: supabase db push

create or replace function public.search_contacts(p_query text)
returns table (id uuid, name text, email text, role text)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(
      nullif(p.full_name, ''),
      nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
      p.email
    ) as name,
    p.email,
    p.role
  from public.profiles p
  where p.role in ('admin', 'super_admin', 'manager', 'trainer', 'content_editor')
    and p.deleted_at is null
    and p.id <> auth.uid()
    and (
      coalesce(p_query, '') = ''
      or p.full_name ilike '%' || p_query || '%'
      or p.first_name ilike '%' || p_query || '%'
      or p.last_name ilike '%' || p_query || '%'
      or p.email ilike '%' || p_query || '%'
    )
  order by name
  limit 25;
$$;

revoke execute on function public.search_contacts(text) from public;
grant execute on function public.search_contacts(text) to authenticated;
