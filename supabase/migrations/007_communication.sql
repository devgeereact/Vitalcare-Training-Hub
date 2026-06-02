-- ============================================================================
-- Vitalcare Training Hub — Communication modules (Phase 10)
-- Forums + Q&A wall, learner feedback / NPS, web-push subscriptions.
-- Helper functions is_staff() / is_admin() are defined in 001_schema.sql.
-- ============================================================================

-- ---------------------------------------------------------------- forums ----
-- A thread is either a course discussion or a Q&A question (kind).
create table if not exists public.forum_threads (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references public.courses (id) on delete cascade,
  kind         text not null default 'discussion'
               check (kind in ('discussion', 'qa')),
  title        text not null,
  created_by   uuid references public.profiles (id) on delete set null,
  is_resolved  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index if not exists forum_threads_course_idx on public.forum_threads (course_id);
create index if not exists forum_threads_kind_idx on public.forum_threads (kind);

create table if not exists public.forum_posts (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.forum_threads (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  body        text not null,
  is_answer   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists forum_posts_thread_idx on public.forum_posts (thread_id);

-- -------------------------------------------------------------- feedback ----
create table if not exists public.feedback_responses (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid references public.courses (id) on delete set null,
  learner_id  uuid references public.profiles (id) on delete cascade,
  nps         smallint check (nps between 0 and 10),
  rating      smallint check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);
create index if not exists feedback_course_idx on public.feedback_responses (course_id);

-- --------------------------------------------------------- push subs --------
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists push_subs_user_idx on public.push_subscriptions (user_id);

-- ---------------------------------------------------------------- RLS -------
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.feedback_responses enable row level security;
alter table public.push_subscriptions enable row level security;

-- Forums: any authenticated user can read; authors create their own; authors
-- or staff may edit/remove.
drop policy if exists forum_threads_select on public.forum_threads;
create policy forum_threads_select on public.forum_threads for select
  using (auth.uid() is not null);
drop policy if exists forum_threads_insert on public.forum_threads;
create policy forum_threads_insert on public.forum_threads for insert
  with check (created_by = auth.uid());
drop policy if exists forum_threads_update on public.forum_threads;
create policy forum_threads_update on public.forum_threads for update
  using (created_by = auth.uid() or public.is_staff())
  with check (created_by = auth.uid() or public.is_staff());
drop policy if exists forum_threads_delete on public.forum_threads;
create policy forum_threads_delete on public.forum_threads for delete
  using (created_by = auth.uid() or public.is_staff());

drop policy if exists forum_posts_select on public.forum_posts;
create policy forum_posts_select on public.forum_posts for select
  using (auth.uid() is not null);
drop policy if exists forum_posts_insert on public.forum_posts;
create policy forum_posts_insert on public.forum_posts for insert
  with check (author_id = auth.uid());
drop policy if exists forum_posts_update on public.forum_posts;
create policy forum_posts_update on public.forum_posts for update
  using (author_id = auth.uid() or public.is_staff())
  with check (author_id = auth.uid() or public.is_staff());
drop policy if exists forum_posts_delete on public.forum_posts;
create policy forum_posts_delete on public.forum_posts for delete
  using (author_id = auth.uid() or public.is_staff());

-- Feedback: learners submit their own; learners read their own, staff read all.
drop policy if exists feedback_insert on public.feedback_responses;
create policy feedback_insert on public.feedback_responses for insert
  with check (learner_id = auth.uid());
drop policy if exists feedback_select on public.feedback_responses;
create policy feedback_select on public.feedback_responses for select
  using (learner_id = auth.uid() or public.is_staff());

-- Push subscriptions: a user only ever sees and manages their own.
drop policy if exists push_subs_all on public.push_subscriptions;
create policy push_subs_all on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
