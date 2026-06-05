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

export type OneToOneStatus = "pending" | "approved" | "declined" | "completed"

export type OneToOneRequest = {
  id: string
  learner_id: string
  course_id: string | null
  trainer_id: string | null
  preferred_at: string | null
  scheduled_at: string | null
  note: string | null
  status: OneToOneStatus
  meet_url: string | null
  created_at: string
  decided_by: string | null
  decided_at: string | null
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
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  about: string | null
  is_verified: boolean
  verified_at: string | null
  verified_by: string | null
}

export type Department = Timestamps & {
  id: string
  organisation_id: string
  name: string
  description: string | null
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
  thumbnail_url: string | null
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
  zoom_start_url: string | null
  meet_url: string | null
  gcal_event_id: string | null
  recording_url: string | null
  template_id: string | null
  organisation_id: string | null
}

export type GoogleOauthToken = {
  id: string
  refresh_token: string
  scope: string | null
  connected_email: string | null
  connected_by: string | null
  created_at: string
  updated_at: string
}

export type ForumThreadKind = "discussion" | "qa"

export type ForumThread = Timestamps & {
  id: string
  course_id: string | null
  kind: ForumThreadKind
  title: string
  created_by: string | null
  is_resolved: boolean
}

export type ForumPost = Timestamps & {
  id: string
  thread_id: string
  author_id: string | null
  body: string
  is_answer: boolean
}

export type FeedbackResponse = {
  id: string
  course_id: string | null
  learner_id: string | null
  nps: number | null
  rating: number | null
  comment: string | null
  created_at: string
}

export type PushSubscription = {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export type AnnouncementAck = {
  id: string
  announcement_id: string
  user_id: string
  acknowledged_at: string
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "void"
export interface InvoiceItem {
  description: string
  quantity: number
  unit_pence: number
}
export type Invoice = {
  id: string
  number: string
  recipient_id: string | null
  recipient_name: string | null
  recipient_email: string | null
  items: InvoiceItem[]
  total_pence: number
  status: InvoiceStatus
  due_date: string | null
  notes: string | null
  issued_by: string | null
  created_at: string
  paid_at: string | null
}

export type PayrollStatus = "draft" | "approved" | "paid"
export type Payroll = {
  id: string
  staff_id: string
  staff_name: string
  staff_email: string | null
  period: string
  period_start: string | null
  period_end: string | null
  gross_pence: number
  deductions_pence: number
  net_pence: number
  notes: string | null
  status: PayrollStatus
  issued_by: string | null
  paid_at: string | null
  created_at: string
}

export type MailMessage = {
  id: string
  message_id: string | null
  uid: number | null
  from_name: string | null
  from_addr: string | null
  subject: string | null
  snippet: string | null
  body_html: string | null
  body_text: string | null
  has_attachments: boolean
  attachments: { name: string; url: string; size?: number; type?: string }[]
  received_at: string | null
  seen: boolean
  created_at: string
}

export type Reminder = {
  id: string
  user_id: string
  title: string
  body: string | null
  link: string | null
  remind_at: string
  sent: boolean
  created_at: string
}

export type CalendarEvent = {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  all_day: boolean
  color: string
  link: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Product = Timestamps & {
  id: string
  name: string
  description: string | null
  price_pence: number
  course_id: string | null
  thumbnail_url: string | null
  is_published: boolean
  created_by: string | null
}

export type OrderStatus = "pending" | "paid" | "cancelled" | "refunded"
export type PaymentMethod = "bank_transfer" | "paypal"

export type Order = {
  id: string
  buyer_id: string | null
  status: OrderStatus
  total_pence: number
  payment_method: PaymentMethod
  coupon_code: string | null
  reference: string | null
  created_at: string
  paid_at: string | null
  confirmed_by: string | null
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  unit_price_pence: number
}

export type Coupon = {
  id: string
  code: string
  percent_off: number | null
  amount_off_pence: number | null
  expires_at: string | null
  max_uses: number | null
  used_count: number
  is_active: boolean
  created_at: string
}

export type LearningPath = Timestamps & {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  is_published: boolean
  created_by: string | null
}

export type LearningPathCourse = {
  id: string
  path_id: string
  course_id: string
  position: number
}

export type CourseReview = {
  id: string
  course_id: string
  learner_id: string
  rating: number
  comment: string | null
  created_at: string
}

export type CourseFaq = {
  id: string
  course_id: string
  question: string
  answer: string
  position: number
  created_at: string
}

export type CoursePrerequisite = {
  id: string
  course_id: string
  prerequisite_id: string
  created_at: string
}

export type Cohort = Timestamps & {
  id: string
  name: string
  description: string | null
  organisation_id: string | null
  created_by: string | null
}

export type CohortMember = {
  id: string
  cohort_id: string
  learner_id: string
  created_at: string
}

export type EmailCampaignStatus =
  | "scheduled"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled"

export type EmailCampaign = {
  id: string
  subject: string
  message: string
  audience: string
  scheduled_at: string
  status: EmailCampaignStatus
  sent_count: number
  total_count: number
  created_by: string | null
  created_at: string
  sent_at: string | null
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
  certificate_number: string | null
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
  action_at: string | null
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
      google_oauth_tokens: {
        Row: GoogleOauthToken
        Insert: Partial<GoogleOauthToken> & Pick<GoogleOauthToken, "refresh_token">
        Update: Partial<GoogleOauthToken>
        Relationships: []
      }
      audit_logs: {
        Row: AuditLog
        Insert: Partial<AuditLog> & Pick<AuditLog, "action">
        Update: Partial<AuditLog>
        Relationships: []
      }
      forum_threads: TableShape<ForumThread, "title">
      forum_posts: TableShape<ForumPost, "thread_id" | "body">
      feedback_responses: {
        Row: FeedbackResponse
        Insert: Partial<FeedbackResponse>
        Update: Partial<FeedbackResponse>
        Relationships: []
      }
      push_subscriptions: {
        Row: PushSubscription
        Insert: Partial<PushSubscription> &
          Pick<PushSubscription, "user_id" | "endpoint" | "p256dh" | "auth">
        Update: Partial<PushSubscription>
        Relationships: []
      }
      email_campaigns: {
        Row: EmailCampaign
        Insert: Partial<EmailCampaign> & Pick<EmailCampaign, "subject" | "message">
        Update: Partial<EmailCampaign>
        Relationships: []
      }
      one_to_one_requests: {
        Row: OneToOneRequest
        Insert: Partial<OneToOneRequest> & Pick<OneToOneRequest, "learner_id">
        Update: Partial<OneToOneRequest>
        Relationships: []
      }
      announcement_acks: {
        Row: AnnouncementAck
        Insert: Partial<AnnouncementAck> &
          Pick<AnnouncementAck, "announcement_id" | "user_id">
        Update: Partial<AnnouncementAck>
        Relationships: []
      }
      reminders: {
        Row: Reminder
        Insert: Partial<Reminder> & Pick<Reminder, "user_id" | "title" | "remind_at">
        Update: Partial<Reminder>
        Relationships: []
      }
      mail_messages: {
        Row: MailMessage
        Insert: Partial<MailMessage>
        Update: Partial<MailMessage>
        Relationships: []
      }
      invoices: {
        Row: Invoice
        Insert: Partial<Invoice> & Pick<Invoice, "number">
        Update: Partial<Invoice>
        Relationships: []
      }
      payroll: {
        Row: Payroll
        Insert: Partial<Payroll> & Pick<Payroll, "staff_id" | "staff_name" | "period">
        Update: Partial<Payroll>
        Relationships: []
      }
      calendar_events: {
        Row: CalendarEvent
        Insert: Partial<CalendarEvent> &
          Pick<CalendarEvent, "title" | "starts_at" | "ends_at">
        Update: Partial<CalendarEvent>
        Relationships: []
      }
      products: TableShape<Product, "name">
      coupons: TableShape<Coupon, "code">
      orders: {
        Row: Order
        Insert: Partial<Order>
        Update: Partial<Order>
        Relationships: []
      }
      order_items: {
        Row: OrderItem
        Insert: Partial<OrderItem> & Pick<OrderItem, "order_id">
        Update: Partial<OrderItem>
        Relationships: []
      }
      learning_paths: TableShape<LearningPath, "name">
      learning_path_courses: {
        Row: LearningPathCourse
        Insert: Partial<LearningPathCourse> &
          Pick<LearningPathCourse, "path_id" | "course_id">
        Update: Partial<LearningPathCourse>
        Relationships: []
      }
      course_reviews: {
        Row: CourseReview
        Insert: Partial<CourseReview> &
          Pick<CourseReview, "course_id" | "learner_id" | "rating">
        Update: Partial<CourseReview>
        Relationships: []
      }
      course_faqs: {
        Row: CourseFaq
        Insert: Partial<CourseFaq> & Pick<CourseFaq, "course_id" | "question" | "answer">
        Update: Partial<CourseFaq>
        Relationships: []
      }
      course_prerequisites: {
        Row: CoursePrerequisite
        Insert: Partial<CoursePrerequisite> &
          Pick<CoursePrerequisite, "course_id" | "prerequisite_id">
        Update: Partial<CoursePrerequisite>
        Relationships: []
      }
      cohorts: TableShape<Cohort, "name">
      cohort_members: {
        Row: CohortMember
        Insert: Partial<CohortMember> & Pick<CohortMember, "cohort_id" | "learner_id">
        Update: Partial<CohortMember>
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
