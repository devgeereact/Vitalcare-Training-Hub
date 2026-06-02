-- ============================================================================
-- Vitalcare Training Hub — Course reviews, FAQs, prerequisites (Phase 11)
-- is_staff() defined in 001_schema.sql.
-- ============================================================================

-- Reviews & ratings (one per learner per course).
create table if not exists public.course_reviews (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  learner_id  uuid not null references public.profiles (id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (course_id, learner_id)
);
create index if not exists course_reviews_course_idx on public.course_reviews (course_id);

-- FAQ entries per course.
create table if not exists public.course_faqs (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  question    text not null,
  answer      text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists course_faqs_course_idx on public.course_faqs (course_id);

-- Prerequisite courses (must complete prerequisite_id before course_id).
create table if not exists public.course_prerequisites (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null references public.courses (id) on delete cascade,
  prerequisite_id uuid not null references public.courses (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (course_id, prerequisite_id),
  check (course_id <> prerequisite_id)
);
create index if not exists course_prereqs_course_idx on public.course_prerequisites (course_id);

alter table public.course_reviews enable row level security;
alter table public.course_faqs enable row level security;
alter table public.course_prerequisites enable row level security;

-- Reviews: any authenticated user reads; learners write their own.
drop policy if exists course_reviews_select on public.course_reviews;
create policy course_reviews_select on public.course_reviews for select
  using (auth.uid() is not null);
drop policy if exists course_reviews_insert on public.course_reviews;
create policy course_reviews_insert on public.course_reviews for insert
  with check (learner_id = auth.uid());
drop policy if exists course_reviews_update on public.course_reviews;
create policy course_reviews_update on public.course_reviews for update
  using (learner_id = auth.uid()) with check (learner_id = auth.uid());
drop policy if exists course_reviews_delete on public.course_reviews;
create policy course_reviews_delete on public.course_reviews for delete
  using (learner_id = auth.uid() or public.is_staff());

-- FAQs + prerequisites: everyone reads, staff manages.
drop policy if exists course_faqs_select on public.course_faqs;
create policy course_faqs_select on public.course_faqs for select
  using (auth.uid() is not null);
drop policy if exists course_faqs_write on public.course_faqs;
create policy course_faqs_write on public.course_faqs for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists course_prereqs_select on public.course_prerequisites;
create policy course_prereqs_select on public.course_prerequisites for select
  using (auth.uid() is not null);
drop policy if exists course_prereqs_write on public.course_prerequisites;
create policy course_prereqs_write on public.course_prerequisites for all
  using (public.is_staff()) with check (public.is_staff());
