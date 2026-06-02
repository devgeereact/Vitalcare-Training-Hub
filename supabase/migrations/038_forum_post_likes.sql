-- 038_forum_post_likes.sql
-- Likes on forum posts (one per user per post). Comments already exist as
-- forum_posts rows, so only likes need a new store.

create table if not exists public.forum_post_likes (
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists forum_post_likes_post_idx
  on public.forum_post_likes (post_id);

alter table public.forum_post_likes enable row level security;

drop policy if exists forum_post_likes_select on public.forum_post_likes;
create policy forum_post_likes_select on public.forum_post_likes
  for select using (auth.uid() is not null);

drop policy if exists forum_post_likes_insert on public.forum_post_likes;
create policy forum_post_likes_insert on public.forum_post_likes
  for insert with check (user_id = auth.uid());

drop policy if exists forum_post_likes_delete on public.forum_post_likes;
create policy forum_post_likes_delete on public.forum_post_likes
  for delete using (user_id = auth.uid());
