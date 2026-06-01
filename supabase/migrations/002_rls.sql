-- ============================================================================
-- Vitalcare Training Hub — Row Level Security (Phase 3)
-- RLS enabled on every table. Helper functions defined in 001_schema.sql.
-- ============================================================================

-- Enable RLS everywhere
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- Convenience: drop a policy if it exists, then create. Postgres lacks
-- "create policy if not exists", so guard each with a drop.

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles for insert
  with check (public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- organisations / departments
-- ----------------------------------------------------------------------------
drop policy if exists orgs_select on public.organisations;
create policy orgs_select on public.organisations for select
  using (public.is_staff() or id = (select organisation_id from public.profiles where id = auth.uid()));

drop policy if exists orgs_write on public.organisations;
create policy orgs_write on public.organisations for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists depts_select on public.departments;
create policy depts_select on public.departments for select
  using (public.is_staff() or organisation_id = (select organisation_id from public.profiles where id = auth.uid()));

drop policy if exists depts_write on public.departments;
create policy depts_write on public.departments for all
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- course_categories (public read for marketing)
-- ----------------------------------------------------------------------------
drop policy if exists categories_read on public.course_categories;
create policy categories_read on public.course_categories for select using (true);

drop policy if exists categories_write on public.course_categories;
create policy categories_write on public.course_categories for all
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- courses (published readable by anyone; staff manage)
-- ----------------------------------------------------------------------------
drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses for select
  using (is_published or public.is_staff());

drop policy if exists courses_write on public.courses;
create policy courses_write on public.courses for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- modules / lessons (authenticated read; staff manage)
-- ----------------------------------------------------------------------------
drop policy if exists modules_read on public.modules;
create policy modules_read on public.modules for select using (auth.uid() is not null);
drop policy if exists modules_write on public.modules;
create policy modules_write on public.modules for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists lessons_read on public.lessons;
create policy lessons_read on public.lessons for select using (auth.uid() is not null);
drop policy if exists lessons_write on public.lessons;
create policy lessons_write on public.lessons for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- enrollments
-- ----------------------------------------------------------------------------
drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select
  using (learner_id = auth.uid() or public.is_staff());

drop policy if exists enrollments_write on public.enrollments;
create policy enrollments_write on public.enrollments for all
  using (public.is_staff()) with check (public.is_staff());

-- learners may update their own progress row
drop policy if exists enrollments_update_own on public.enrollments;
create policy enrollments_update_own on public.enrollments for update
  using (learner_id = auth.uid()) with check (learner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- lesson_progress (learner owns; staff read)
-- ----------------------------------------------------------------------------
drop policy if exists lesson_progress_select on public.lesson_progress;
create policy lesson_progress_select on public.lesson_progress for select
  using (learner_id = auth.uid() or public.is_staff());
drop policy if exists lesson_progress_write on public.lesson_progress;
create policy lesson_progress_write on public.lesson_progress for all
  using (learner_id = auth.uid()) with check (learner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- assessments / questions / options (authenticated read; staff manage)
-- ----------------------------------------------------------------------------
drop policy if exists assessments_read on public.assessments;
create policy assessments_read on public.assessments for select using (auth.uid() is not null);
drop policy if exists assessments_write on public.assessments;
create policy assessments_write on public.assessments for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists questions_read on public.questions;
create policy questions_read on public.questions for select using (auth.uid() is not null);
drop policy if exists questions_write on public.questions;
create policy questions_write on public.questions for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists options_read on public.question_options;
create policy options_read on public.question_options for select using (auth.uid() is not null);
drop policy if exists options_write on public.question_options;
create policy options_write on public.question_options for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- attempts / answers (learner owns; staff read)
-- ----------------------------------------------------------------------------
drop policy if exists attempts_select on public.assessment_attempts;
create policy attempts_select on public.assessment_attempts for select
  using (learner_id = auth.uid() or public.is_staff());
drop policy if exists attempts_insert_own on public.assessment_attempts;
create policy attempts_insert_own on public.assessment_attempts for insert
  with check (learner_id = auth.uid());
drop policy if exists attempts_update on public.assessment_attempts;
create policy attempts_update on public.assessment_attempts for update
  using (learner_id = auth.uid() or public.is_staff())
  with check (learner_id = auth.uid() or public.is_staff());

drop policy if exists answers_select on public.attempt_answers;
create policy answers_select on public.attempt_answers for select
  using (
    public.is_staff()
    or exists (
      select 1 from public.assessment_attempts a
      where a.id = attempt_answers.attempt_id and a.learner_id = auth.uid()
    )
  );
drop policy if exists answers_write on public.attempt_answers;
create policy answers_write on public.attempt_answers for all
  using (
    public.is_staff()
    or exists (
      select 1 from public.assessment_attempts a
      where a.id = attempt_answers.attempt_id and a.learner_id = auth.uid()
    )
  )
  with check (
    public.is_staff()
    or exists (
      select 1 from public.assessment_attempts a
      where a.id = attempt_answers.attempt_id and a.learner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- sessions / bookings / attendance / templates
-- ----------------------------------------------------------------------------
drop policy if exists sessions_read on public.training_sessions;
create policy sessions_read on public.training_sessions for select
  using (is_public or auth.uid() is not null);
drop policy if exists sessions_write on public.training_sessions;
create policy sessions_write on public.training_sessions for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists templates_all on public.recurring_templates;
create policy templates_all on public.recurring_templates for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists bookings_select on public.session_bookings;
create policy bookings_select on public.session_bookings for select
  using (learner_id = auth.uid() or public.is_staff());
drop policy if exists bookings_insert_own on public.session_bookings;
create policy bookings_insert_own on public.session_bookings for insert
  with check (learner_id = auth.uid() or public.is_staff());
drop policy if exists bookings_modify on public.session_bookings;
create policy bookings_modify on public.session_bookings for update
  using (learner_id = auth.uid() or public.is_staff())
  with check (learner_id = auth.uid() or public.is_staff());
drop policy if exists bookings_delete on public.session_bookings;
create policy bookings_delete on public.session_bookings for delete
  using (learner_id = auth.uid() or public.is_staff());

drop policy if exists attendance_select on public.attendance_records;
create policy attendance_select on public.attendance_records for select
  using (learner_id = auth.uid() or public.is_staff());
drop policy if exists attendance_write on public.attendance_records;
create policy attendance_write on public.attendance_records for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- certificates
-- ----------------------------------------------------------------------------
drop policy if exists cert_templates_all on public.certificate_templates;
create policy cert_templates_all on public.certificate_templates for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists certs_select on public.learner_certificates;
create policy certs_select on public.learner_certificates for select
  using (learner_id = auth.uid() or public.is_staff());
drop policy if exists certs_write on public.learner_certificates;
create policy certs_write on public.learner_certificates for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- payments
-- ----------------------------------------------------------------------------
drop policy if exists plans_read on public.subscription_plans;
create policy plans_read on public.subscription_plans for select using (true);
drop policy if exists plans_write on public.subscription_plans;
create policy plans_write on public.subscription_plans for all
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists subs_select on public.subscriptions;
create policy subs_select on public.subscriptions for select
  using (public.is_admin() or organisation_id = (select organisation_id from public.profiles where id = auth.uid()));
drop policy if exists subs_write on public.subscriptions;
create policy subs_write on public.subscriptions for all
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- communications
-- ----------------------------------------------------------------------------
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for select
  using (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert
  with check (public.is_staff() or user_id = auth.uid());

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert
  with check (sender_id = auth.uid());
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages for update
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements for select
  using (published_at is not null or public.is_staff());
drop policy if exists announcements_write on public.announcements;
create policy announcements_write on public.announcements for all
  using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- trainers (public read of bios for marketing)
-- ----------------------------------------------------------------------------
drop policy if exists trainer_profiles_read on public.trainer_profiles;
create policy trainer_profiles_read on public.trainer_profiles for select using (true);
drop policy if exists trainer_profiles_write on public.trainer_profiles;
create policy trainer_profiles_write on public.trainer_profiles for all
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists trainer_avail_read on public.trainer_availability;
create policy trainer_avail_read on public.trainer_availability for select
  using (auth.uid() is not null);
drop policy if exists trainer_avail_write on public.trainer_availability;
create policy trainer_avail_write on public.trainer_availability for all
  using (trainer_id = auth.uid() or public.is_admin())
  with check (trainer_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- AI conversations (owner only)
-- ----------------------------------------------------------------------------
drop policy if exists ai_own on public.ai_conversations;
create policy ai_own on public.ai_conversations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- audit_logs (super_admin read; authenticated append; never update/delete)
-- ----------------------------------------------------------------------------
drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs for select
  using (public.is_super_admin());
drop policy if exists audit_insert on public.audit_logs;
create policy audit_insert on public.audit_logs for insert
  with check (auth.uid() is not null);

-- ----------------------------------------------------------------------------
-- Public certificate verification (no table exposure to anon)
-- Returns only the fields shown on the public verify page.
-- ----------------------------------------------------------------------------
create or replace function public.verify_certificate(p_uuid uuid)
returns table (
  learner_name text,
  course_title text,
  cpd_hours    numeric,
  issued_at    timestamptz,
  expires_at   timestamptz,
  is_valid     boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.full_name,
    c.title,
    lc.cpd_hours,
    lc.issued_at,
    lc.expires_at,
    (lc.deleted_at is null and (lc.expires_at is null or lc.expires_at > now()))
  from public.learner_certificates lc
  join public.profiles p on p.id = lc.learner_id
  left join public.courses c on c.id = lc.course_id
  where lc.verification_uuid = p_uuid
    and lc.deleted_at is null;
$$;

grant execute on function public.verify_certificate(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Table privileges. RLS still governs row visibility; these grants let the
-- anon/authenticated roles reach the tables at all. (Supabase usually sets
-- these by default; declared here so the schema is self-contained.)
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

