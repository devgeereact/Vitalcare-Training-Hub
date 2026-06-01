-- ============================================================================
-- Vitalcare Training Hub — Schema (Phase 3)
-- All 13 TMS modules. Universal columns: id, created_at, updated_at, deleted_at.
-- Run order: 001_schema → 002_rls → 003_seed
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('super_admin', 'admin', 'trainer', 'learner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enrollment_status as enum ('not_started', 'in_progress', 'completed', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lesson_type as enum ('text', 'video', 'scorm', 'h5p', 'document');
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_type as enum ('mcq', 'true_false', 'fill_blank', 'free_text');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present', 'absent', 'late', 'excused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('booked', 'waitlisted', 'cancelled', 'attended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('info', 'enrolment', 'session', 'certificate', 'message', 'announcement', 'system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('active', 'trialing', 'past_due', 'cancelled');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Core identity
-- ----------------------------------------------------------------------------
create table if not exists public.organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  sector      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text not null,
  first_name      text,
  last_name       text,
  full_name       text generated always as (
                    nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')
                  ) stored,
  avatar_url      text,
  role            user_role not null default 'learner',
  organisation_id uuid references public.organisations (id) on delete set null,
  phone           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create table if not exists public.departments (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  name            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ----------------------------------------------------------------------------
-- Courses & content
-- ----------------------------------------------------------------------------
create table if not exists public.course_categories (
  id            text primary key,
  name          text not null,
  slug          text not null unique,
  course_count  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table if not exists public.courses (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text unique,
  summary         text,
  description     text,
  category_id     text references public.course_categories (id) on delete set null,
  is_cstf_aligned boolean not null default false,
  cpd_hours       numeric(5, 1) not null default 0,
  duration_mins   integer not null default 0,
  is_published    boolean not null default false,
  organisation_id uuid references public.organisations (id) on delete set null,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  title       text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.lessons (
  id            uuid primary key default gen_random_uuid(),
  module_id     uuid not null references public.modules (id) on delete cascade,
  title         text not null,
  type          lesson_type not null default 'text',
  content       text,
  video_url     text,
  scorm_url     text,
  document_url  text,
  duration_mins integer not null default 0,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table if not exists public.enrollments (
  id            uuid primary key default gen_random_uuid(),
  learner_id    uuid not null references public.profiles (id) on delete cascade,
  course_id     uuid not null references public.courses (id) on delete cascade,
  status        enrollment_status not null default 'not_started',
  progress_pct  integer not null default 0 check (progress_pct between 0 and 100),
  enrolled_at   timestamptz not null default now(),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (learner_id, course_id)
);

create table if not exists public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  learner_id   uuid not null references public.profiles (id) on delete cascade,
  lesson_id    uuid not null references public.lessons (id) on delete cascade,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (learner_id, lesson_id)
);

-- ----------------------------------------------------------------------------
-- Assessments
-- ----------------------------------------------------------------------------
create table if not exists public.assessments (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid references public.courses (id) on delete cascade,
  title         text not null,
  description   text,
  pass_mark     integer not null default 80 check (pass_mark between 0 and 100),
  time_limit_mins integer,
  max_attempts  integer,
  randomise     boolean not null default false,
  is_published  boolean not null default false,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  type          question_type not null default 'mcq',
  prompt        text not null,
  points        integer not null default 1,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table if not exists public.question_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label       text not null,
  is_correct  boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.assessment_attempts (
  id              uuid primary key default gen_random_uuid(),
  assessment_id   uuid not null references public.assessments (id) on delete cascade,
  learner_id      uuid not null references public.profiles (id) on delete cascade,
  score           integer not null default 0,
  passed          boolean not null default false,
  time_taken_secs integer,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create table if not exists public.attempt_answers (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid not null references public.assessment_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  response    text,
  is_correct  boolean,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ----------------------------------------------------------------------------
-- Attendance & scheduling
-- ----------------------------------------------------------------------------
create table if not exists public.recurring_templates (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  rrule       text not null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.training_sessions (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid references public.courses (id) on delete set null,
  trainer_id      uuid references public.profiles (id) on delete set null,
  title           text not null,
  description     text,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  venue           text,
  capacity        integer,
  is_virtual      boolean not null default false,
  is_public       boolean not null default false,
  status          session_status not null default 'scheduled',
  zoom_meeting_id text,
  zoom_join_url   text,
  gcal_event_id   text,
  template_id     uuid references public.recurring_templates (id) on delete set null,
  organisation_id uuid references public.organisations (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create table if not exists public.session_bookings (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references public.training_sessions (id) on delete cascade,
  learner_id        uuid not null references public.profiles (id) on delete cascade,
  status            booking_status not null default 'booked',
  waitlist_position integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (session_id, learner_id)
);

create table if not exists public.attendance_records (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.training_sessions (id) on delete cascade,
  learner_id  uuid not null references public.profiles (id) on delete cascade,
  status      attendance_status not null default 'absent',
  marked_by   uuid references public.profiles (id) on delete set null,
  marked_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (session_id, learner_id)
);

-- ----------------------------------------------------------------------------
-- Certificates
-- ----------------------------------------------------------------------------
create table if not exists public.certificate_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  canvas      jsonb not null default '{}'::jsonb,
  width       integer not null default 842,
  height      integer not null default 595,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.learner_certificates (
  id                uuid primary key default gen_random_uuid(),
  learner_id        uuid not null references public.profiles (id) on delete cascade,
  course_id         uuid references public.courses (id) on delete set null,
  template_id       uuid references public.certificate_templates (id) on delete set null,
  verification_uuid uuid not null default gen_random_uuid() unique,
  hash              text,
  cpd_hours         numeric(5, 1) not null default 0,
  issued_at         timestamptz not null default now(),
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

-- ----------------------------------------------------------------------------
-- Payments (UI only until Phase 2 of product; no Stripe)
-- ----------------------------------------------------------------------------
create table if not exists public.subscription_plans (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique,
  price_pence     integer not null default 0,
  interval        text not null default 'month',
  features        jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  plan_id         uuid references public.subscription_plans (id) on delete set null,
  status          subscription_status not null default 'trialing',
  started_at      timestamptz not null default now(),
  ends_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ----------------------------------------------------------------------------
-- Communications
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        notification_type not null default 'info',
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table if not exists public.announcements (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  body            text not null,
  author_id       uuid references public.profiles (id) on delete set null,
  organisation_id uuid references public.organisations (id) on delete cascade,
  course_id       uuid references public.courses (id) on delete cascade,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- ----------------------------------------------------------------------------
-- Trainers
-- ----------------------------------------------------------------------------
create table if not exists public.trainer_profiles (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles (id) on delete cascade unique,
  bio              text,
  specialisms      text[] not null default '{}',
  zoom_personal_id text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table if not exists public.trainer_availability (
  id           uuid primary key default gen_random_uuid(),
  trainer_id   uuid not null references public.profiles (id) on delete cascade,
  weekday      integer not null check (weekday between 0 and 6),
  start_time   time not null,
  end_time     time not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- ----------------------------------------------------------------------------
-- AI
-- ----------------------------------------------------------------------------
create table if not exists public.ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text,
  messages    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ----------------------------------------------------------------------------
-- Audit (append-only)
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes (hot lookup paths)
-- ----------------------------------------------------------------------------
create index if not exists idx_profiles_org on public.profiles (organisation_id);
create index if not exists idx_courses_category on public.courses (category_id);
create index if not exists idx_courses_org on public.courses (organisation_id);
create index if not exists idx_modules_course on public.modules (course_id);
create index if not exists idx_lessons_module on public.lessons (module_id);
create index if not exists idx_enrollments_learner on public.enrollments (learner_id);
create index if not exists idx_enrollments_course on public.enrollments (course_id);
create index if not exists idx_lesson_progress_learner on public.lesson_progress (learner_id);
create index if not exists idx_questions_assessment on public.questions (assessment_id);
create index if not exists idx_attempts_learner on public.assessment_attempts (learner_id);
create index if not exists idx_sessions_starts on public.training_sessions (starts_at);
create index if not exists idx_bookings_session on public.session_bookings (session_id);
create index if not exists idx_attendance_session on public.attendance_records (session_id);
create index if not exists idx_certs_learner on public.learner_certificates (learner_id);
create index if not exists idx_certs_verification on public.learner_certificates (verification_uuid);
create index if not exists idx_notifications_user on public.notifications (user_id);
create index if not exists idx_messages_recipient on public.messages (recipient_id);
create index if not exists idx_audit_user on public.audit_logs (user_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers on every table with updated_at
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format(
      'drop trigger if exists trg_set_updated_at on public.%I; ' ||
      'create trigger trg_set_updated_at before update on public.%I ' ||
      'for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- New auth user -> profile row
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    'learner'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Role helpers for RLS (security definer to avoid recursive policy reads)
-- ----------------------------------------------------------------------------
create or replace function public.current_role_value()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_value() in ('admin', 'super_admin'), false);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_value() = 'super_admin', false);
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_value() in ('trainer', 'admin', 'super_admin'), false);
$$;
