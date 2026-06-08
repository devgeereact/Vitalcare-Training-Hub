-- Blog like milestones + file upload notifications.
-- Deploy: supabase db push

-- ── Blog like milestone ─────────────────────────────────────────────────────
-- Likes are anonymous, so a per-like notification has no actor. Instead notify
-- the author when the post crosses a multiple of 10 likes. like_milestone tracks
-- the last notified count so it fires once per milestone.
alter table public.blog_posts
  add column if not exists like_milestone integer not null default 0;

create or replace function public.toggle_blog_like(p_slug text, p_liked boolean)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count  integer;
  v_author   uuid;
  v_title    text;
  v_milestone integer;
begin
  update public.blog_posts
  set like_count = greatest(0, like_count + case when p_liked then 1 else -1 end)
  where slug = p_slug and status = 'published'
  returning like_count, author_id, title, like_milestone
    into new_count, v_author, v_title, v_milestone;

  if p_liked
     and new_count is not null
     and new_count % 10 = 0
     and new_count > coalesce(v_milestone, 0)
     and v_author is not null then
    insert into public.notifications (user_id, type, title, body, link)
    values (v_author, 'info',
      'Your article reached ' || new_count || ' likes',
      coalesce(v_title, 'Your article'),
      '/resources/blog/' || p_slug);
    update public.blog_posts set like_milestone = new_count where slug = p_slug;
  end if;

  return coalesce(new_count, 0);
end;
$$;
grant execute on function public.toggle_blog_like(text, boolean) to anon, authenticated;

-- ── File uploaded ───────────────────────────────────────────────────────────
-- Files live in storage (no row to trigger on), so the app calls this after an
-- upload. Notifies other staff that a new file is in the file manager.
create or replace function public.notify_file_uploaded(p_name text)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.is_staff() then
    return;
  end if;
  insert into public.notifications (user_id, type, title, body, link)
  select p.id, 'info', 'New file uploaded', coalesce(p_name, 'A file'), '/platform/files'
  from public.profiles p
  where p.role in ('super_admin', 'admin', 'manager', 'trainer', 'content_editor')
    and p.deleted_at is null
    and p.id <> auth.uid();
end;
$$;
revoke execute on function public.notify_file_uploaded(text) from public;
grant execute on function public.notify_file_uploaded(text) to authenticated;
