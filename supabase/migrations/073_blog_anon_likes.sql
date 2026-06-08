-- Blog: allow anyone (no sign-in) to like a post.
-- Likes were per signed-in user (blog_post_likes). The public website needs
-- anonymous likes, so we keep a plain counter on the post and toggle it through
-- a security-definer function, the same pattern as increment_blog_views. The
-- browser remembers its own liked state in localStorage; the server only holds
-- the aggregate count.
-- Deploy: supabase db push

alter table public.blog_posts
  add column if not exists like_count integer not null default 0;

-- Seed the counter from any existing per-user likes so launch posts keep them.
update public.blog_posts p
set like_count = sub.c
from (
  select post_id, count(*)::int as c
  from public.blog_post_likes
  group by post_id
) sub
where sub.post_id = p.id and p.like_count = 0;

-- Toggle a like on a published post. p_liked = true adds one, false removes one
-- (never below zero). Returns the new count. Anonymous callers allowed.
create or replace function public.toggle_blog_like(p_slug text, p_liked boolean)
returns integer language plpgsql security definer set search_path = public as $$
declare
  new_count integer;
begin
  update public.blog_posts
  set like_count = greatest(0, like_count + case when p_liked then 1 else -1 end)
  where slug = p_slug and status = 'published'
  returning like_count into new_count;
  return coalesce(new_count, 0);
end;
$$;
grant execute on function public.toggle_blog_like(text, boolean) to anon, authenticated;
