import { createBrowserRouter } from "react-router-dom"

import AppLayout from "@/layouts/AppLayout"
import ModuleComingSoon from "@/pages/platform/ModuleComingSoon"
import DashboardPage from "@/pages/platform/DashboardPage"
import LearnersListPage from "@/pages/platform/learners/LearnersListPage"
import LearnerNewPage from "@/pages/platform/learners/LearnerNewPage"
import LearnerDetailPage from "@/pages/platform/learners/LearnerDetailPage"
import LearnerEditPage from "@/pages/platform/learners/LearnerEditPage"
import CoursesManagePage from "@/pages/platform/courses/CoursesManagePage"
import CourseBuilderPage from "@/pages/platform/courses/CourseBuilderPage"
import CourseOverviewPage from "@/pages/platform/courses/CourseOverviewPage"
import MyCoursesPage from "@/pages/platform/courses/MyCoursesPage"
import LessonPlayerPage from "@/pages/platform/courses/LessonPlayerPage"
import QuizListPage from "@/pages/platform/assessments/QuizListPage"
import QuizBuilderPage from "@/pages/platform/assessments/QuizBuilderPage"
import TakeAssessmentPage from "@/pages/platform/assessments/TakeAssessmentPage"
import ResultsPage from "@/pages/platform/assessments/ResultsPage"
import SessionsListPage from "@/pages/platform/sessions/SessionsListPage"
import SessionFormPage from "@/pages/platform/sessions/SessionFormPage"
import SessionDetailPage from "@/pages/platform/sessions/SessionDetailPage"
import CheckInPage from "@/pages/platform/sessions/CheckInPage"
import PlatformCalendarPage from "@/pages/platform/sessions/CalendarPage"
import AttendanceLogPage from "@/pages/platform/sessions/AttendanceLogPage"
import CertificatesListPage from "@/pages/platform/certificates/CertificatesListPage"
import CertTemplatesPage from "@/pages/platform/certificates/CertTemplatesPage"
import CertVerifyPage from "@/pages/platform/certificates/CertVerifyPage"
import AiAssistantPage from "@/pages/platform/ai/AiAssistantPage"
import SettingsPage from "@/pages/platform/settings/SettingsPage"
import NotificationsPage from "@/pages/platform/notifications/NotificationsPage"
import MessagesPage from "@/pages/platform/messages/MessagesPage"
import AnnouncementsPage from "@/pages/platform/announcements/AnnouncementsPage"
import TrainersListPage from "@/pages/platform/trainers/TrainersListPage"
import AnalyticsPage from "@/pages/platform/analytics/AnalyticsPage"
import ReportsPage from "@/pages/platform/reports/ReportsPage"
import ComplianceMatrixPage from "@/pages/platform/compliance/ComplianceMatrixPage"
import AuditLogPage from "@/pages/platform/audit/AuditLogPage"
import PaymentsPage from "@/pages/platform/payments/PaymentsPage"
import FeesReceiptsPage from "@/pages/platform/payments/FeesReceiptsPage"
import EnrolmentsPage from "@/pages/platform/enrolments/EnrolmentsPage"
import StaffPage from "@/pages/platform/staff/StaffPage"
import DepartmentsPage from "@/pages/platform/departments/DepartmentsPage"
import VirtualTrainingPage from "@/pages/platform/virtual/VirtualTrainingPage"
import LibraryPage from "@/pages/platform/library/LibraryPage"
import BlogAdminPage from "@/pages/platform/blog/BlogAdminPage"
import BlogEditPage from "@/pages/platform/blog/BlogEditPage"
import LearningPathsPage from "@/pages/platform/courses/LearningPathsPage"
import LearningPathDetailPage from "@/pages/platform/courses/LearningPathDetailPage"
import CohortsPage from "@/pages/platform/cohorts/CohortsPage"
import ForumsPage from "@/pages/platform/forums/ForumsPage"
import HolidaysPage from "@/pages/platform/sessions/HolidaysPage"
import StoreCataloguePage from "@/pages/platform/store/StoreCataloguePage"
import StoreOrdersPage from "@/pages/platform/store/StoreOrdersPage"
import StoreCouponsPage from "@/pages/platform/store/StoreCouponsPage"
import ThreadPage from "@/pages/platform/forums/ThreadPage"
import QaWallPage from "@/pages/platform/qa/QaWallPage"
import FeedbackPage from "@/pages/platform/feedback/FeedbackPage"
import FeedbackResultsPage from "@/pages/platform/feedback/FeedbackResultsPage"
import EmailComposerPage from "@/pages/platform/email/EmailComposerPage"
import CohortDetailPage from "@/pages/platform/cohorts/CohortDetailPage"
import IntegrationsPage from "@/pages/platform/settings/IntegrationsPage"
import OneToOnePage from "@/pages/platform/one-to-one/OneToOnePage"
import UserManagementPage from "@/pages/platform/people/UserManagementPage"
import ProfilePage from "@/pages/platform/profile/ProfilePage"
import InboxPage from "@/pages/platform/email/InboxPage"
import MailDetailPage from "@/pages/platform/email/MailDetailPage"
import MySessionsPage from "@/pages/platform/sessions/MySessionsPage"
import TrainerTimetablePage from "@/pages/platform/sessions/TrainerTimetablePage"
import PayrollPage from "@/pages/platform/payroll/PayrollPage"
import PasswordSettingsPage from "@/pages/platform/account/PasswordSettingsPage"
import InvoicesPage from "@/pages/platform/invoices/InvoicesPage"
import FileManagerPage2 from "@/pages/platform/files/FileManagerPage"
import { RoleGuard } from "@/guards/RoleGuard"
import AuthLayout from "@/layouts/AuthLayout"




import LoginPage from "@/auth/basic/LoginPage"
import RegisterPage from "@/auth/basic/RegisterPage"
import ForgotPasswordPage from "@/auth/basic/ForgotPasswordPage"

import NotFound from "@/pages/NotFound"
import ErrorPage from "@/pages/ErrorPage"
import { ResetPasswordForm } from "@/auth/basic/ResetPasswordForm"
import { VerifyEmailForm } from "@/auth/basic/VerifyEmailForm"
import { PasswordResetSuccess } from "@/auth/basic/PasswordResetSuccess"
import CoverLoginPage from "@/auth/cover/CoverLoginPage"
import CoverForgotPasswordPage from "@/auth/cover/CoverForgotPasswordPage"
import CoverRegisterPage from "@/auth/cover/CoverRegisterPage"
import CoverResetPasswordPage from "@/auth/cover/CoverResetPasswordPage"
import CoverVerifyEmailPage from "@/auth/cover/CoverVerifyEmailPage"
import CoverPasswordResetSuccessPage from "@/auth/cover/CoverPasswordResetSuccessPage"
import Error404 from "@/pages/error/Error404"
import Error500 from "@/pages/error/Error500"
import ComingSoon from "@/pages/error/ComingSoon"

import AuthCallback from "@/pages/auth/callback"
import { AuthGuard } from "@/guards/AuthGuard"

// Marketing (public)
import MarketingLayout from "@/layouts/MarketingLayout"
import HomePage from "@/pages/marketing/HomePage"
import AboutUsPage from "@/pages/marketing/AboutUsPage"
import OurCoursesPage from "@/pages/marketing/OurCoursesPage"
import CategoryPage from "@/pages/marketing/CategoryPage"
import CourseDetailPage from "@/pages/marketing/CourseDetailPage"
import TrainingSolutionPage from "@/pages/marketing/TrainingSolutionPage"
import VerifyCertPage from "@/pages/marketing/VerifyCertPage"
import AccreditationsPage from "@/pages/marketing/AccreditationsPage"
import BlogPage from "@/pages/marketing/BlogPage"
import BlogPostPage from "@/pages/marketing/BlogPostPage"
import EventsPage from "@/pages/marketing/EventsPage"
import ContactPage from "@/pages/marketing/ContactPage"
import FAQLegalPage from "@/pages/marketing/legal/FAQPage"
import PrivacyPolicyPage from "@/pages/marketing/legal/PrivacyPolicyPage"
import RefundPolicyPage from "@/pages/marketing/legal/RefundPolicyPage"
import CookiePolicyPage from "@/pages/marketing/legal/CookiePolicyPage"
import TermsPage from "@/pages/marketing/legal/TermsPage"

export const router = createBrowserRouter (
  [
    // 🌐 MARKETING (public)
    {
      element: <MarketingLayout />,
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
      element: <AuthLayout />,
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
        <AuthGuard>
          <AppLayout />
        </AuthGuard>
      ),
      errorElement: <ErrorPage />,
      children: [
        {index: true, element: <DashboardPage /> },
        {path: "dashboard", element: <DashboardPage /> },

        // 👥 LEARNER MANAGEMENT (admin / manager)
        {
          path: "learners",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer"]}>
              <LearnersListPage />
            </RoleGuard>
          ),
        },
        {
          path: "learners/new",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer"]}>
              <LearnerNewPage />
            </RoleGuard>
          ),
        },
        {
          path: "learners/:id",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer"]}>
              <LearnerDetailPage />
            </RoleGuard>
          ),
        },
        {
          path: "learners/:id/edit",
          element: (
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer"]}>
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
            <RoleGuard roles={["super_admin", "admin", "manager", "trainer"]}>
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
        { path: "feedback/results", element: <FeedbackResultsPage /> },
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
