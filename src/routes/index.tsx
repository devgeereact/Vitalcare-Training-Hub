import { Suspense, lazy, type ReactElement } from "react"
import { createBrowserRouter } from "react-router-dom"

import { RouteFallback } from "@/routes/route-fallback"

import { RoleGuard } from "@/guards/RoleGuard"





import NotFound from "@/pages/NotFound"
import ErrorPage from "@/pages/ErrorPage"

import { AuthGuard } from "@/guards/AuthGuard"

// Marketing (public)
import MarketingLayout from "@/layouts/MarketingLayout"
import HomePage from "@/pages/marketing/HomePage"

/* ---------------------------------------------------------------------------
   Route-level code splitting
   ---------------------------------------------------------------------------
   Every page below was a static import, so one bundle carried the whole
   platform: a visitor reading the public homepage downloaded the course
   builder, the calendar, the payroll module and the spreadsheet exporter
   before the page became usable. Each route now loads only when it is first
   visited.

   Deliberately eager: the marketing layout and the homepage (they are the
   first paint for most visitors), the guards (they decide what to render at
   all), and the error pages (they must work when a chunk fails to load).
   --------------------------------------------------------------------------- */

const AppLayout = lazy(() => import("@/layouts/AppLayout"))
const ModuleComingSoon = lazy(() => import("@/pages/platform/ModuleComingSoon"))
const DashboardPage = lazy(() => import("@/pages/platform/DashboardPage"))
const LearnersListPage = lazy(() => import("@/pages/platform/learners/LearnersListPage"))
const LearnerNewPage = lazy(() => import("@/pages/platform/learners/LearnerNewPage"))
const LearnerDetailPage = lazy(() => import("@/pages/platform/learners/LearnerDetailPage"))
const LearnerEditPage = lazy(() => import("@/pages/platform/learners/LearnerEditPage"))
const CoursesManagePage = lazy(() => import("@/pages/platform/courses/CoursesManagePage"))
const CourseBuilderPage = lazy(() => import("@/pages/platform/courses/CourseBuilderPage"))
const CourseOverviewPage = lazy(() => import("@/pages/platform/courses/CourseOverviewPage"))
const MyCoursesPage = lazy(() => import("@/pages/platform/courses/MyCoursesPage"))
const EnrolledCoursesPage = lazy(() => import("@/pages/platform/courses/EnrolledCoursesPage"))
const LessonPlayerPage = lazy(() => import("@/pages/platform/courses/LessonPlayerPage"))
const QuizListPage = lazy(() => import("@/pages/platform/assessments/QuizListPage"))
const QuizBuilderPage = lazy(() => import("@/pages/platform/assessments/QuizBuilderPage"))
const TakeAssessmentPage = lazy(() => import("@/pages/platform/assessments/TakeAssessmentPage"))
const ResultsPage = lazy(() => import("@/pages/platform/assessments/ResultsPage"))
const SessionsListPage = lazy(() => import("@/pages/platform/sessions/SessionsListPage"))
const SessionFormPage = lazy(() => import("@/pages/platform/sessions/SessionFormPage"))
const SessionDetailPage = lazy(() => import("@/pages/platform/sessions/SessionDetailPage"))
const CheckInPage = lazy(() => import("@/pages/platform/sessions/CheckInPage"))
const PlatformCalendarPage = lazy(() => import("@/pages/platform/sessions/CalendarPage"))
const AttendanceLogPage = lazy(() => import("@/pages/platform/sessions/AttendanceLogPage"))
const CertificatesListPage = lazy(() => import("@/pages/platform/certificates/CertificatesListPage"))
const CertTemplatesPage = lazy(() => import("@/pages/platform/certificates/CertTemplatesPage"))
const CertVerifyPage = lazy(() => import("@/pages/platform/certificates/CertVerifyPage"))
const AiAssistantPage = lazy(() => import("@/pages/platform/ai/AiAssistantPage"))
const SettingsPage = lazy(() => import("@/pages/platform/settings/SettingsPage"))
const NotificationsPage = lazy(() => import("@/pages/platform/notifications/NotificationsPage"))
const MessagesPage = lazy(() => import("@/pages/platform/messages/MessagesPage"))
const AnnouncementsPage = lazy(() => import("@/pages/platform/announcements/AnnouncementsPage"))
const TrainersListPage = lazy(() => import("@/pages/platform/trainers/TrainersListPage"))
const AnalyticsPage = lazy(() => import("@/pages/platform/analytics/AnalyticsPage"))
const ReportsPage = lazy(() => import("@/pages/platform/reports/ReportsPage"))
const ComplianceMatrixPage = lazy(() => import("@/pages/platform/compliance/ComplianceMatrixPage"))
const AuditLogPage = lazy(() => import("@/pages/platform/audit/AuditLogPage"))
const PaymentsPage = lazy(() => import("@/pages/platform/payments/PaymentsPage"))
const FeesReceiptsPage = lazy(() => import("@/pages/platform/payments/FeesReceiptsPage"))
const EnrolmentsPage = lazy(() => import("@/pages/platform/enrolments/EnrolmentsPage"))
const StaffPage = lazy(() => import("@/pages/platform/staff/StaffPage"))
const DepartmentsPage = lazy(() => import("@/pages/platform/departments/DepartmentsPage"))
const VirtualTrainingPage = lazy(() => import("@/pages/platform/virtual/VirtualTrainingPage"))
const LibraryPage = lazy(() => import("@/pages/platform/library/LibraryPage"))
const MyResourcesPage = lazy(() => import("@/pages/platform/library/MyResourcesPage"))
const BlogAdminPage = lazy(() => import("@/pages/platform/blog/BlogAdminPage"))
const BlogEditPage = lazy(() => import("@/pages/platform/blog/BlogEditPage"))
const LearningPathsPage = lazy(() => import("@/pages/platform/courses/LearningPathsPage"))
const LearningPathDetailPage = lazy(() => import("@/pages/platform/courses/LearningPathDetailPage"))
const CohortsPage = lazy(() => import("@/pages/platform/cohorts/CohortsPage"))
const ForumsPage = lazy(() => import("@/pages/platform/forums/ForumsPage"))
const HolidaysPage = lazy(() => import("@/pages/platform/sessions/HolidaysPage"))
const StoreCataloguePage = lazy(() => import("@/pages/platform/store/StoreCataloguePage"))
const StoreOrdersPage = lazy(() => import("@/pages/platform/store/StoreOrdersPage"))
const StoreCouponsPage = lazy(() => import("@/pages/platform/store/StoreCouponsPage"))
const ThreadPage = lazy(() => import("@/pages/platform/forums/ThreadPage"))
const QaWallPage = lazy(() => import("@/pages/platform/qa/QaWallPage"))
const FeedbackPage = lazy(() => import("@/pages/platform/feedback/FeedbackPage"))
const FeedbackResultsPage = lazy(() => import("@/pages/platform/feedback/FeedbackResultsPage"))
const EmailComposerPage = lazy(() => import("@/pages/platform/email/EmailComposerPage"))
const CohortDetailPage = lazy(() => import("@/pages/platform/cohorts/CohortDetailPage"))
const IntegrationsPage = lazy(() => import("@/pages/platform/settings/IntegrationsPage"))
const OneToOnePage = lazy(() => import("@/pages/platform/one-to-one/OneToOnePage"))
const UserManagementPage = lazy(() => import("@/pages/platform/people/UserManagementPage"))
const ProfilePage = lazy(() => import("@/pages/platform/profile/ProfilePage"))
const InboxPage = lazy(() => import("@/pages/platform/email/InboxPage"))
const MailDetailPage = lazy(() => import("@/pages/platform/email/MailDetailPage"))
const MySessionsPage = lazy(() => import("@/pages/platform/sessions/MySessionsPage"))
const TrainerTimetablePage = lazy(() => import("@/pages/platform/sessions/TrainerTimetablePage"))
const PayrollPage = lazy(() => import("@/pages/platform/payroll/PayrollPage"))
const PasswordSettingsPage = lazy(() => import("@/pages/platform/account/PasswordSettingsPage"))
const InvoicesPage = lazy(() => import("@/pages/platform/invoices/InvoicesPage"))
const FileManagerPage2 = lazy(() => import("@/pages/platform/files/FileManagerPage"))
const MyFilesPage = lazy(() => import("@/pages/platform/files/MyFilesPage"))
const AuthLayout = lazy(() => import("@/layouts/AuthLayout"))
const LoginPage = lazy(() => import("@/auth/basic/LoginPage"))
const RegisterPage = lazy(() => import("@/auth/basic/RegisterPage"))
const ForgotPasswordPage = lazy(() => import("@/auth/basic/ForgotPasswordPage"))
const ResetPasswordForm = lazy(() =>
  import("@/auth/basic/ResetPasswordForm").then((m) => ({ default: m.ResetPasswordForm })),
)
const VerifyEmailForm = lazy(() =>
  import("@/auth/basic/VerifyEmailForm").then((m) => ({ default: m.VerifyEmailForm })),
)
const PasswordResetSuccess = lazy(() =>
  import("@/auth/basic/PasswordResetSuccess").then((m) => ({ default: m.PasswordResetSuccess })),
)
const CoverLoginPage = lazy(() => import("@/auth/cover/CoverLoginPage"))
const CoverForgotPasswordPage = lazy(() => import("@/auth/cover/CoverForgotPasswordPage"))
const CoverRegisterPage = lazy(() => import("@/auth/cover/CoverRegisterPage"))
const CoverResetPasswordPage = lazy(() => import("@/auth/cover/CoverResetPasswordPage"))
const CoverVerifyEmailPage = lazy(() => import("@/auth/cover/CoverVerifyEmailPage"))
const CoverPasswordResetSuccessPage = lazy(() => import("@/auth/cover/CoverPasswordResetSuccessPage"))
const Error404 = lazy(() => import("@/pages/error/Error404"))
const Error500 = lazy(() => import("@/pages/error/Error500"))
const ComingSoon = lazy(() => import("@/pages/error/ComingSoon"))
const AuthCallback = lazy(() => import("@/pages/auth/callback"))
const AboutUsPage = lazy(() => import("@/pages/marketing/AboutUsPage"))
const OurCoursesPage = lazy(() => import("@/pages/marketing/OurCoursesPage"))
const CategoryPage = lazy(() => import("@/pages/marketing/CategoryPage"))
const CourseDetailPage = lazy(() => import("@/pages/marketing/CourseDetailPage"))
const TrainingSolutionPage = lazy(() => import("@/pages/marketing/TrainingSolutionPage"))
const VerifyCertPage = lazy(() => import("@/pages/marketing/VerifyCertPage"))
const AccreditationsPage = lazy(() => import("@/pages/marketing/AccreditationsPage"))
const BlogPage = lazy(() => import("@/pages/marketing/BlogPage"))
const BlogPostPage = lazy(() => import("@/pages/marketing/BlogPostPage"))
const EventsPage = lazy(() => import("@/pages/marketing/EventsPage"))
const ContactPage = lazy(() => import("@/pages/marketing/ContactPage"))
const FAQLegalPage = lazy(() => import("@/pages/marketing/legal/FAQPage"))
const PrivacyPolicyPage = lazy(() => import("@/pages/marketing/legal/PrivacyPolicyPage"))
const RefundPolicyPage = lazy(() => import("@/pages/marketing/legal/RefundPolicyPage"))
const CookiePolicyPage = lazy(() => import("@/pages/marketing/legal/CookiePolicyPage"))
const TermsPage = lazy(() => import("@/pages/marketing/legal/TermsPage"))


/** Wrap a route element in its own Suspense boundary. */
function route(Component: React.ComponentType): ReactElement {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Component />
    </Suspense>
  )
}

export const router = createBrowserRouter (
  [
    // 🌐 MARKETING (public)
    {
      element: route(MarketingLayout),
      errorElement: <ErrorPage />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "about-us", element: <AboutUsPage /> },
        { path: "our-courses", element: <OurCoursesPage /> },
        { path: "our-courses/course/:slug", element: <CourseDetailPage /> },
        { path: "our-courses/:categorySlug", element: <CategoryPage /> },
        { path: "training-solutions/:sector", element: <TrainingSolutionPage /> },
        { path: "resources/verify-certificate", element: <VerifyCertPage /> },
        { path: "resources/accreditations", element: <AccreditationsPage /> },
        { path: "resources/blog", element: <BlogPage /> },
        { path: "resources/blog/:slug", element: <BlogPostPage /> },
        { path: "resources/events", element: <EventsPage /> },
        { path: "contact-us", element: <ContactPage /> },
        { path: "faq", element: <FAQLegalPage /> },
        { path: "privacy-policy", element: <PrivacyPolicyPage /> },
        { path: "refund-policy", element: <RefundPolicyPage /> },
        { path: "cookie-policy", element: <CookiePolicyPage /> },
        { path: "terms-and-conditions", element: <TermsPage /> },
      ],
    },

    // 🔐 AUTH ROUTES
    {
      element: route(AuthLayout),
      errorElement: <ErrorPage />,
      children: [
        // 🔑 Vitalcare auth (canonical paths)
        {path: "sign-in", element: <CoverLoginPage /> },
        {path: "sign-up", element: <CoverRegisterPage /> },
        {path: "forgot-password", element: <CoverForgotPasswordPage /> },
        {path: "reset-password", element: <CoverResetPasswordPage /> },
        {path: "auth/callback", element: <AuthCallback /> },

        {path: "auth/basic/login", element: <LoginPage /> },
        {path: "auth/basic/register", element: <RegisterPage /> },
        {path: "auth/basic/forgot-password", element: <ForgotPasswordPage /> },
        {path: "auth/basic/reset-password", element: <ResetPasswordForm /> },
        {path: "auth/basic/verify-email", element: <VerifyEmailForm /> },
        {path: "auth/basic/password-reset-success", element: <PasswordResetSuccess /> },

        {path: "auth/cover/login", element: <CoverLoginPage /> },
        {path: "auth/cover/register", element: <CoverRegisterPage /> },
        {path: "auth/cover/forgot-password", element: <CoverForgotPasswordPage /> },
        {path: "auth/cover/new-password", element: <CoverResetPasswordPage /> },
        {path: "auth/cover/password-reset-success", element: <CoverPasswordResetSuccessPage /> },
        {path: "auth/cover/verify-email", element: <CoverVerifyEmailPage /> },

        {path: "error/error-404", element: <Error404 /> },
        {path: "error/error-500", element: <Error500 /> },
        {path: "error/coming-soon", element: <ComingSoon /> },

      ],
    },

    // 📊 PLATFORM ROUTES (authenticated shell, mounted under /platform)
    {
      path: "platform",
      element: (
        <Suspense fallback={<RouteFallback />}>
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        </Suspense>
      ),
      errorElement: <ErrorPage />,
      children: [
        {index: true, element: <DashboardPage /> },
        {path: "dashboard", element: <DashboardPage /> },

        // 👥 LEARNER MANAGEMENT (admin / manager)
        {
          path: "learners",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <LearnersListPage />
            </RoleGuard>
          ),
        },
        {
          path: "learners/new",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <LearnerNewPage />
            </RoleGuard>
          ),
        },
        {
          path: "learners/:id",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <LearnerDetailPage />
            </RoleGuard>
          ),
        },
        {
          path: "learners/:id/edit",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <LearnerEditPage />
            </RoleGuard>
          ),
        },

        // 📚 COURSES
        {
          path: "blog",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <BlogAdminPage />
            </RoleGuard>
          ),
        },
        {
          path: "blog/new",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <BlogEditPage />
            </RoleGuard>
          ),
        },
        {
          path: "blog/:id",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <BlogEditPage />
            </RoleGuard>
          ),
        },
        { path: "courses", element: <MyCoursesPage /> },
        { path: "my-learning", element: <EnrolledCoursesPage /> },
        { path: "courses/:id", element: <CourseOverviewPage /> },
        { path: "courses/:id/learn/:lessonId", element: <LessonPlayerPage /> },
        {
          path: "courses/manage",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <CoursesManagePage />
            </RoleGuard>
          ),
        },
        {
          path: "courses/builder",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <CourseBuilderPage />
            </RoleGuard>
          ),
        },
        {
          path: "courses/builder/:id",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <CourseBuilderPage />
            </RoleGuard>
          ),
        },

        // 📝 ASSESSMENTS
        { path: "assessments/:id", element: <TakeAssessmentPage /> },
        {
          path: "assessments/builder",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <QuizListPage />
            </RoleGuard>
          ),
        },
        {
          path: "assessments/builder/:id",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <QuizBuilderPage />
            </RoleGuard>
          ),
        },
        {
          path: "assessments/results",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer"]}>
              <ResultsPage />
            </RoleGuard>
          ),
        },

        // 📅 SESSIONS & ATTENDANCE
        { path: "calendar", element: <PlatformCalendarPage /> },
        { path: "my-sessions", element: <MySessionsPage /> },
        {
          path: "timetable",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer"]}>
              <TrainerTimetablePage />
            </RoleGuard>
          ),
        },
        { path: "sessions/:id/checkin", element: <CheckInPage /> },
        { path: "sessions", element: <SessionsListPage /> },
        {
          path: "sessions/new",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer"]}>
              <SessionFormPage />
            </RoleGuard>
          ),
        },
        { path: "sessions/:id", element: <SessionDetailPage /> },
        {
          path: "sessions/:id/edit",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer"]}>
              <SessionFormPage />
            </RoleGuard>
          ),
        },
        {
          path: "attendance",
          element: (
            <RoleGuard roles={["super_admin", "admin"]}>
              <AttendanceLogPage />
            </RoleGuard>
          ),
        },

        // 🎓 CERTIFICATES
        // Learners reach this to view/download their OWN certificates (RLS
        // scopes the data); staff manage and issue. Role-aware, open to all.
        { path: "certificates", element: <CertificatesListPage /> },
        {
          path: "certificates/templates",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <CertTemplatesPage />
            </RoleGuard>
          ),
        },
        { path: "certificates/verify", element: <CertVerifyPage /> },

        // 📁 MY FILES (learner certificates + completed-course workbooks)
        { path: "my-files", element: <MyFilesPage /> },
        { path: "my-resources", element: <MyResourcesPage /> },

        // 🤖 AI ASSISTANT
        {
          path: "ai",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <AiAssistantPage />
            </RoleGuard>
          ),
        },

        // 📊 ANALYTICS (admin / manager / trainer)
        {
          path: "analytics",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer"]}>
              <AnalyticsPage />
            </RoleGuard>
          ),
        },
        {
          path: "analytics/org",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <AnalyticsPage />
            </RoleGuard>
          ),
        },

        // 📑 REPORTS & TEMPLATES (admin / manager)
        {
          path: "reports",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <ReportsPage />
            </RoleGuard>
          ),
        },

        // ✅ TRAINING COMPLIANCE (staff read, manager write)
        {
          path: "compliance",
          element: (
            <RoleGuard
              roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}
            >
              <ComplianceMatrixPage />
            </RoleGuard>
          ),
        },

        // 👤 TRAINERS (admin / manager)
        {
          path: "trainers",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <TrainersListPage />
            </RoleGuard>
          ),
        },

        // 💬 COMMUNICATION (any authenticated user)
        { path: "notifications", element: <NotificationsPage /> },
        { path: "messages", element: <MessagesPage /> },
        { path: "announcements", element: <AnnouncementsPage /> },

        // 💳 PAYMENTS (super admin / admin)
        {
          path: "payments",
          element: (
            <RoleGuard roles={["super_admin", "admin"]}>
              <PaymentsPage />
            </RoleGuard>
          ),
        },

        // 📜 AUDIT LOG (super admin only)
        {
          path: "audit",
          element: (
            <RoleGuard roles={["super_admin"]}>
              <AuditLogPage />
            </RoleGuard>
          ),
        },

        // ⚙️ SETTINGS (any authenticated user)
        { path: "settings", element: <SettingsPage /> },
        {
          path: "settings/integrations",
          element: (
            <RoleGuard roles={["super_admin"]}>
              <IntegrationsPage />
            </RoleGuard>
          ),
        },
        
        
        // 📚 LEARNING (extended)
        {
          path: "library",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <LibraryPage />
            </RoleGuard>
          ),
        },
        { path: "courses/paths", element: <LearningPathsPage /> },
        { path: "courses/paths/:id", element: <LearningPathDetailPage /> },
        {
          path: "enrolments",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer"]}>
              <EnrolmentsPage />
            </RoleGuard>
          ),
        },

        // 🧑‍🤝‍🧑 PEOPLE (extended)
        {
          path: "staff",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <StaffPage />
            </RoleGuard>
          ),
        },
        {
          path: "cohorts",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <CohortsPage />
            </RoleGuard>
          ),
        },
        {
          path: "users",
          element: (
            <RoleGuard roles={["super_admin", "admin"]}>
              <UserManagementPage />
            </RoleGuard>
          ),
        },
        { path: "profile", element: <ProfilePage /> },
        { path: "account/password", element: <PasswordSettingsPage /> },
        {
          path: "invoices",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <InvoicesPage />
            </RoleGuard>
          ),
        },
        {
          path: "payroll",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <PayrollPage />
            </RoleGuard>
          ),
        },
        {
          path: "files",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <FileManagerPage2 />
            </RoleGuard>
          ),
        },
        {
          path: "cohorts/:id",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <CohortDetailPage />
            </RoleGuard>
          ),
        },

        // 🎥 VIRTUAL TRAINING
        { path: "virtual", element: <VirtualTrainingPage /> },
        { path: "one-to-one", element: <OneToOnePage /> },

        // 📅 SCHEDULING (extended)
        { path: "holidays", element: <HolidaysPage /> },

        // 💬 COMMUNICATION (extended)
        { path: "forums", element: <ForumsPage /> },
        { path: "forums/:id", element: <ThreadPage /> },
        { path: "qa", element: <QaWallPage /> },
        { path: "qa/:id", element: <ThreadPage /> },
        { path: "feedback", element: <FeedbackPage /> },
        {
          path: "feedback/results",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <FeedbackResultsPage />
            </RoleGuard>
          ),
        },
        {
          path: "email",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <EmailComposerPage />
            </RoleGuard>
          ),
        },
        {
          path: "inbox",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <InboxPage />
            </RoleGuard>
          ),
        },
        {
          path: "inbox/:id",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer", "content_editor"]}>
              <MailDetailPage />
            </RoleGuard>
          ),
        },

        // 🛍️ STORE
        { path: "store", element: <StoreCataloguePage /> },
        {
          path: "store/orders",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <StoreOrdersPage />
            </RoleGuard>
          ),
        },
        {
          path: "store/coupons",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <StoreCouponsPage />
            </RoleGuard>
          ),
        },

        // 🏢 ORGANISATION (extended)
        {
          path: "departments",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager"]}>
              <DepartmentsPage />
            </RoleGuard>
          ),
        },
        {
          path: "payments/fees",
          element: (
            <RoleGuard roles={["super_admin", "admin"]}>
              <FeesReceiptsPage />
            </RoleGuard>
          ),
        },

        // Platform modules still in development land here (branded notice)
        { path: "*", element: <ModuleComingSoon /> },
      ],
    },

    // 🌐 PUBLIC 404 (unknown non-platform routes)
    { path: "*", element: <NotFound /> },
  ],
  {
    basename: "/",
  }
)
