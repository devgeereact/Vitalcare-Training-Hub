/**
 * Supabase database types for Vitalcare Training Hub.
 *
 * Hand-authored to match supabase/migrations/001_schema.sql. After applying the
 * migrations you can regenerate the canonical version with:
 *   supabase gen types typescript --project-id mongirnapzzizmzcrkqp > src/types/database.types.ts
 */

export type UserRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "trainer"
  | "content_editor"
  | "learner"
  | "guest"
export type EnrollmentStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "expired"
  | "cancelled"
export type LessonType = "text" | "video" | "scorm" | "h5p" | "document"
export type QuestionType = "mcq" | "true_false" | "fill_blank" | "free_text"
export type AttendanceStatus = "present" | "absent" | "late" | "excused"
export type SessionStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
export type BookingStatus = "booked" | "waitlisted" | "cancelled" | "attended"
export type NotificationType =
  | "info"
  | "enrolment"
  | "session"
  | "certificate"
  | "message"
  | "announcement"
  | "system"
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"

type Timestamps = {
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type Organisation = Timestamps & {
  id: string
  name: string
  slug: string | null
  sector: string | null
}

export type Profile = Timestamps & {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  organisation_id: string | null
  phone: string | null
}

export type Department = Timestamps & {
  id: string
  organisation_id: string
  name: string
}

export type CourseCategory = Timestamps & {
  id: string
  name: string
  slug: string
  course_count: number
}

export type Course = Timestamps & {
  id: string
  title: string
  slug: string | null
  summary: string | null
  description: string | null
  category_id: string | null
  is_cstf_aligned: boolean
  cpd_hours: number
  duration_mins: number
  is_published: boolean
  organisation_id: string | null
  created_by: string | null
}

export type Module = Timestamps & {
  id: string
  course_id: string
  title: string
  position: number
}

export type Lesson = Timestamps & {
  id: string
  module_id: string
  title: string
  type: LessonType
  content: string | null
  video_url: string | null
  scorm_url: string | null
  document_url: string | null
  duration_mins: number
  position: number
}

export type Enrollment = Timestamps & {
  id: string
  learner_id: string
  course_id: string
  status: EnrollmentStatus
  progress_pct: number
  enrolled_at: string
  completed_at: string | null
}

export type LessonProgress = Timestamps & {
  id: string
  learner_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
}

export type Assessment = Timestamps & {
  id: string
  course_id: string | null
  title: string
  description: string | null
  pass_mark: number
  time_limit_mins: number | null
  max_attempts: number | null
  randomise: boolean
  is_published: boolean
  created_by: string | null
}

export type Question = Timestamps & {
  id: string
  assessment_id: string
  type: QuestionType
  prompt: string
  points: number
  position: number
}

export type QuestionOption = Timestamps & {
  id: string
  question_id: string
  label: string
  is_correct: boolean
  position: number
}

export type AssessmentAttempt = Timestamps & {
  id: string
  assessment_id: string
  learner_id: string
  score: number
  passed: boolean
  time_taken_secs: number | null
  completed_at: string | null
}

export type AttemptAnswer = Timestamps & {
  id: string
  attempt_id: string
  question_id: string
  response: string | null
  is_correct: boolean | null
}

export type RecurringTemplate = Timestamps & {
  id: string
  title: string
  rrule: string
  created_by: string | null
}

export type TrainingSession = Timestamps & {
  id: string
  course_id: string | null
  trainer_id: string | null
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  venue: string | null
  capacity: number | null
  is_virtual: boolean
  is_public: boolean
  status: SessionStatus
  zoom_meeting_id: string | null
  zoom_join_url: string | null
  gcal_event_id: string | null
  template_id: string | null
  organisation_id: string | null
}

export type SessionBooking = Timestamps & {
  id: string
  session_id: string
  learner_id: string
  status: BookingStatus
  waitlist_position: number | null
}

export type AttendanceRecord = Timestamps & {
  id: string
  session_id: string
  learner_id: string
  status: AttendanceStatus
  marked_by: string | null
  marked_at: string | null
}

export type CertificateTemplate = Timestamps & {
  id: string
  name: string
  canvas: Record<string, unknown>
  width: number
  height: number
  created_by: string | null
}

export type LearnerCertificate = Timestamps & {
  id: string
  learner_id: string
  course_id: string | null
  template_id: string | null
  verification_uuid: string
  hash: string | null
  cpd_hours: number
  issued_at: string
  expires_at: string | null
}

export type SubscriptionPlan = Timestamps & {
  id: string
  name: string
  slug: string | null
  price_pence: number
  interval: string
  features: unknown
}

export type Subscription = Timestamps & {
  id: string
  organisation_id: string
  plan_id: string | null
  status: SubscriptionStatus
  started_at: string
  ends_at: string | null
}

export type Notification = Timestamps & {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  read_at: string | null
}

export type Message = Timestamps & {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  read_at: string | null
}

export type Announcement = Timestamps & {
  id: string
  title: string
  body: string
  author_id: string | null
  organisation_id: string | null
  course_id: string | null
  published_at: string | null
}

export type TrainerProfile = Timestamps & {
  id: string
  profile_id: string
  bio: string | null
  specialisms: string[]
  zoom_personal_id: string | null
}

export type TrainerAvailability = Timestamps & {
  id: string
  trainer_id: string
  weekday: number
  start_time: string
  end_time: string
}

export type AiConversation = Timestamps & {
  id: string
  user_id: string
  title: string | null
  messages: unknown
}

export type AuditLog = {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

/** Build the standard { Row, Insert, Update, Relationships } shape for a table. */
type TableShape<Row, RequiredInsert extends keyof Row = never> = {
  Row: Row
  Insert: Partial<Row> & Pick<Row, RequiredInsert>
  Update: Partial<Row>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      organisations: TableShape<Organisation, "name">
      profiles: TableShape<Profile, "id" | "email">
      departments: TableShape<Department, "organisation_id" | "name">
      course_categories: TableShape<CourseCategory, "id" | "name" | "slug">
      courses: TableShape<Course, "title">
      modules: TableShape<Module, "course_id" | "title">
      lessons: TableShape<Lesson, "module_id" | "title">
      enrollments: TableShape<Enrollment, "learner_id" | "course_id">
      lesson_progress: TableShape<LessonProgress, "learner_id" | "lesson_id">
      assessments: TableShape<Assessment, "title">
      questions: TableShape<Question, "assessment_id" | "prompt">
      question_options: TableShape<QuestionOption, "question_id" | "label">
      assessment_attempts: TableShape<
        AssessmentAttempt,
        "assessment_id" | "learner_id"
      >
      attempt_answers: TableShape<AttemptAnswer, "attempt_id" | "question_id">
      recurring_templates: TableShape<RecurringTemplate, "title" | "rrule">
      training_sessions: TableShape<
        TrainingSession,
        "title" | "starts_at" | "ends_at"
      >
      session_bookings: TableShape<SessionBooking, "session_id" | "learner_id">
      attendance_records: TableShape<
        AttendanceRecord,
        "session_id" | "learner_id"
      >
      certificate_templates: TableShape<CertificateTemplate, "name">
      learner_certificates: TableShape<LearnerCertificate, "learner_id">
      subscription_plans: TableShape<SubscriptionPlan, "name">
      subscriptions: TableShape<Subscription, "organisation_id">
      notifications: TableShape<Notification, "user_id" | "title">
      messages: TableShape<Message, "sender_id" | "recipient_id" | "body">
      announcements: TableShape<Announcement, "title" | "body">
      trainer_profiles: TableShape<TrainerProfile, "profile_id">
      trainer_availability: TableShape<
        TrainerAvailability,
        "trainer_id" | "weekday" | "start_time" | "end_time"
      >
      ai_conversations: TableShape<AiConversation, "user_id">
      audit_logs: {
        Row: AuditLog
        Insert: Partial<AuditLog> & Pick<AuditLog, "action">
        Update: Partial<AuditLog>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      verify_certificate: {
        Args: { p_uuid: string }
        Returns: {
          learner_name: string
          course_title: string
          cpd_hours: number
          issued_at: string
          expires_at: string | null
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      user_role: UserRole
      enrollment_status: EnrollmentStatus
      lesson_type: LessonType
      question_type: QuestionType
      attendance_status: AttendanceStatus
      session_status: SessionStatus
      booking_status: BookingStatus
      notification_type: NotificationType
      subscription_status: SubscriptionStatus
    }
    CompositeTypes: Record<string, never>
  }
}
