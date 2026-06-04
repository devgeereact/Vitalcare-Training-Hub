-- 054_perf_indexes.sql
-- Performance advisor: add covering indexes for unindexed foreign keys and
-- drop a duplicate index. All additive and safe (no policy or data changes).

-- 1. Drop the duplicate unique index on attendance_records. The matching
--    UNIQUE constraint (..._key) stays and still enforces uniqueness.
drop index if exists public.attendance_unique_pair;

-- 2. Covering indexes for foreign keys (unindexed_foreign_keys).
create index if not exists idx_ai_conversations_user_id on public.ai_conversations (user_id);
create index if not exists idx_announcements_author_id on public.announcements (author_id);
create index if not exists idx_announcements_course_id on public.announcements (course_id);
create index if not exists idx_announcements_organisation_id on public.announcements (organisation_id);
create index if not exists idx_assessment_attempts_assessment_id on public.assessment_attempts (assessment_id);
create index if not exists idx_assessments_course_id on public.assessments (course_id);
create index if not exists idx_assessments_created_by on public.assessments (created_by);
create index if not exists idx_attempt_answers_attempt_id on public.attempt_answers (attempt_id);
create index if not exists idx_attempt_answers_question_id on public.attempt_answers (question_id);
create index if not exists idx_attendance_records_learner_id on public.attendance_records (learner_id);
create index if not exists idx_attendance_records_marked_by on public.attendance_records (marked_by);
create index if not exists idx_blog_post_likes_user_id on public.blog_post_likes (user_id);
create index if not exists idx_blog_posts_author_id on public.blog_posts (author_id);
create index if not exists idx_certificate_templates_created_by on public.certificate_templates (created_by);
create index if not exists idx_cohort_members_learner_id on public.cohort_members (learner_id);
create index if not exists idx_cohorts_created_by on public.cohorts (created_by);
create index if not exists idx_cohorts_organisation_id on public.cohorts (organisation_id);
create index if not exists idx_course_prerequisites_prerequisite_id on public.course_prerequisites (prerequisite_id);
create index if not exists idx_course_resources_created_by on public.course_resources (created_by);
create index if not exists idx_course_reviews_learner_id on public.course_reviews (learner_id);
create index if not exists idx_courses_created_by on public.courses (created_by);
create index if not exists idx_department_tasks_created_by on public.department_tasks (created_by);
create index if not exists idx_departments_organisation_id on public.departments (organisation_id);
create index if not exists idx_email_campaigns_created_by on public.email_campaigns (created_by);
create index if not exists idx_feedback_responses_approved_by on public.feedback_responses (approved_by);
create index if not exists idx_feedback_responses_learner_id on public.feedback_responses (learner_id);
create index if not exists idx_forum_post_likes_user_id on public.forum_post_likes (user_id);
create index if not exists idx_forum_posts_author_id on public.forum_posts (author_id);
create index if not exists idx_forum_threads_created_by on public.forum_threads (created_by);
create index if not exists idx_google_oauth_tokens_connected_by on public.google_oauth_tokens (connected_by);
create index if not exists idx_integration_settings_updated_by on public.integration_settings (updated_by);
create index if not exists idx_invoices_issued_by on public.invoices (issued_by);
create index if not exists idx_learner_certificates_course_id on public.learner_certificates (course_id);
create index if not exists idx_learner_certificates_template_id on public.learner_certificates (template_id);
create index if not exists idx_learning_path_courses_course_id on public.learning_path_courses (course_id);
create index if not exists idx_learning_paths_created_by on public.learning_paths (created_by);
create index if not exists idx_lesson_progress_lesson_id on public.lesson_progress (lesson_id);
create index if not exists idx_messages_sender_id on public.messages (sender_id);
create index if not exists idx_one_to_one_requests_course_id on public.one_to_one_requests (course_id);
create index if not exists idx_one_to_one_requests_decided_by on public.one_to_one_requests (decided_by);
create index if not exists idx_order_items_product_id on public.order_items (product_id);
create index if not exists idx_orders_confirmed_by on public.orders (confirmed_by);
create index if not exists idx_org_holidays_created_by on public.org_holidays (created_by);
create index if not exists idx_payroll_issued_by on public.payroll (issued_by);
create index if not exists idx_products_course_id on public.products (course_id);
create index if not exists idx_products_created_by on public.products (created_by);
create index if not exists idx_profiles_verified_by on public.profiles (verified_by);
create index if not exists idx_question_options_question_id on public.question_options (question_id);
create index if not exists idx_recurring_templates_created_by on public.recurring_templates (created_by);
create index if not exists idx_reminders_user_id on public.reminders (user_id);
create index if not exists idx_resource_allocations_created_by on public.resource_allocations (created_by);
create index if not exists idx_session_bookings_learner_id on public.session_bookings (learner_id);
create index if not exists idx_subscriptions_organisation_id on public.subscriptions (organisation_id);
create index if not exists idx_subscriptions_plan_id on public.subscriptions (plan_id);
create index if not exists idx_trainer_availability_trainer_id on public.trainer_availability (trainer_id);
create index if not exists idx_training_sessions_course_id on public.training_sessions (course_id);
create index if not exists idx_training_sessions_organisation_id on public.training_sessions (organisation_id);
create index if not exists idx_training_sessions_template_id on public.training_sessions (template_id);
create index if not exists idx_training_sessions_trainer_id on public.training_sessions (trainer_id);
