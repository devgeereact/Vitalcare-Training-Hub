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
import AuditLogPage from "@/pages/platform/audit/AuditLogPage"
import PaymentsPage from "@/pages/platform/payments/PaymentsPage"
import FeesReceiptsPage from "@/pages/platform/payments/FeesReceiptsPage"
import EnrolmentsPage from "@/pages/platform/enrolments/EnrolmentsPage"
import StaffPage from "@/pages/platform/staff/StaffPage"
import DepartmentsPage from "@/pages/platform/departments/DepartmentsPage"
import VirtualTrainingPage from "@/pages/platform/virtual/VirtualTrainingPage"
import LibraryPage from "@/pages/platform/library/LibraryPage"
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

import AnalyticsDashboard from "@/pages/dashboard/analytics/AnalyticsDashboard"
import EcommerceDashboard from "@/pages/dashboard/eCommerce/EcommerceDashboard"
import CrmDashboard from "@/pages/dashboard/crm/CrmDashboard"

import ChartsPage from "@/pages/charts/recharts/ReChartsPage"

import DataWidgetsPage from "@/pages/widgets/data/DataWidgetsPage"
import StatisticsWidgetsPage from "@/pages/widgets/statistics/StatisticsWidgetsPage"

import LoginPage from "@/auth/basic/LoginPage"
import RegisterPage from "@/auth/basic/RegisterPage"
import ForgotPasswordPage from "@/auth/basic/ForgotPasswordPage"

import NotFound from "@/pages/NotFound"
import ErrorPage from "@/pages/ErrorPage"
import Documentation from "@/pages/Documentation"
import { ResetPasswordForm } from "@/auth/basic/ResetPasswordForm"
import { VerifyEmailForm } from "@/auth/basic/VerifyEmailForm"
import { PasswordResetSuccess } from "@/auth/basic/PasswordResetSuccess"
import CoverLoginPage from "@/auth/cover/CoverLoginPage"
import CoverForgotPasswordPage from "@/auth/cover/CoverForgotPasswordPage"
import CoverRegisterPage from "@/auth/cover/CoverRegisterPage"
import CoverResetPasswordPage from "@/auth/cover/CoverResetPasswordPage"
import CoverVerifyEmailPage from "@/auth/cover/CoverVerifyEmailPage"
import CoverPasswordResetSuccessPage from "@/auth/cover/CoverPasswordResetSuccessPage"
import ProductList from "@/pages/eCommerce/ProductList"
import ProductGrid from "@/pages/eCommerce/ProductGrid"
import AddProduct from "@/pages/eCommerce/AddProduct"
import CategoryList from "@/pages/eCommerce/CategoryList"
import OrderList from "@/pages/eCommerce/OrderList"
import OrderDetails from "@/pages/eCommerce/OrderDetails"
import InvoicePage from "@/pages/eCommerce/Invoice"
import InvoiceCard from "@/pages/eCommerce/InvoiceCard"
import CustomerList from "@/pages/eCommerce/CustomerList"
import CustomerDetails from "@/pages/eCommerce/CustomerDetails"
import ChatBox from "@/pages/apps/Chatbox"
import CalendarPage from "@/pages/apps/CalendarPage"
import FileManagerPage from "@/pages/apps/FileManager"
import AlertsPage from "@/pages/alerts/AlertsPage"
import AccordionPage from "@/pages/accordion/AccordionPage"
import SoonerPage from "@/pages/sooner/SoonerPage"
import BadgesPage from "@/pages/badges/BadgesPage"
import ButtonsPage from "@/pages/buttons/ButtonsPage"
import CardsPage from "@/pages/cards/CardsPage"
import ListGroupPage from "@/pages/listgroups/ListGroupPage"
import CarouselPage from "@/pages/carousels/CarouselPage"
import AvatarShowcase from "@/pages/mediaobject/AvatarShowcase"
import NavbarsPage from "@/pages/navbars/NavbarsPage"
import ProgressPage from "@/pages/progressbars/ProgressPage"
import SpinnerExamples from "@/pages/spinners/SpinnerExamples"
import Boxicons from "@/pages/icons/Boxicons"
import IconBootstrap from "@/pages/icons/Bootstrap"
import LucideIconsPage from "@/pages/icons/LucideIconsPage"
import PricingPage from "@/pages/pricing/PricingPage"
import FAQPage from "@/pages/FAQPage"
import Error404 from "@/pages/error/Error404"
import Error500 from "@/pages/error/Error500"
import ComingSoon from "@/pages/error/ComingSoon"
import ReChartsPage from "@/pages/charts/recharts/ReChartsPage"
import ApexChartsPage from "@/pages/charts/apexcharts/ApexChartsPage"
import UserProfile from "@/pages/account/UserProfile"
import EditProfile from "@/pages/account/EditProfile"
import PasswordSettings from "@/pages/account/PasswordSettings"
import NotificationSettings from "@/pages/account/NotificationSettings"
import BasicTables from "@/pages/tables/BasicTables"
import AdvanceTablesPage from "@/pages/tables/advance-tables/AdvanceTable"
import DataTablePage from "@/pages/tables/DataTablePage"
import BasicInput from "@/pages/forms/BasicInputs"
import FormInputGroup from "@/pages/forms/FormInputGroup"
import ChecksAndRadios from "@/pages/forms/ChecksAndRadios"
import FormLayouts from "@/pages/forms/FormLayouts"
import WizardPage from "@/pages/forms/wizard/WizardPage"
import FormTextEditor from "@/pages/forms/FormTextEditor"
import FileUpload01 from "@/pages/forms/fileupload/FileUpload01"
import DatePickerPage from "@/pages/forms/datepicker/DatePickerPage"
import SelectExamplesPage from "@/pages/forms/select/SelectExamplesPage"
import FormRepeater from "@/pages/forms/FormRepeater"
import LandingPage from "@/pages/dashboard/analytics/LandingPage"

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
        {path: "dashboard/analytics", element: <AnalyticsDashboard /> },

        // 👥 LEARNER MANAGEMENT (admin / manager)
        {
          path: "learners",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <LearnersListPage />
            </RoleGuard>
          ),
        },
        {
          path: "learners/new",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <LearnerNewPage />
            </RoleGuard>
          ),
        },
        {
          path: "learners/:id",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <LearnerDetailPage />
            </RoleGuard>
          ),
        },
        {
          path: "learners/:id/edit",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <LearnerEditPage />
            </RoleGuard>
          ),
        },

        // 📚 COURSES
        { path: "courses", element: <MyCoursesPage /> },
        { path: "courses/:id", element: <CourseOverviewPage /> },
        { path: "courses/:id/learn/:lessonId", element: <LessonPlayerPage /> },
        {
          path: "courses/manage",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <CoursesManagePage />
            </RoleGuard>
          ),
        },
        {
          path: "courses/builder",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <CourseBuilderPage />
            </RoleGuard>
          ),
        },
        {
          path: "courses/builder/:id",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <CourseBuilderPage />
            </RoleGuard>
          ),
        },

        // 📝 ASSESSMENTS
        { path: "assessments/:id", element: <TakeAssessmentPage /> },
        {
          path: "assessments/builder",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <QuizListPage />
            </RoleGuard>
          ),
        },
        {
          path: "assessments/builder/:id",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <QuizBuilderPage />
            </RoleGuard>
          ),
        },
        {
          path: "assessments/results",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
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
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <TrainerTimetablePage />
            </RoleGuard>
          ),
        },
        { path: "sessions/:id/checkin", element: <CheckInPage /> },
        {
          path: "sessions",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <SessionsListPage />
            </RoleGuard>
          ),
        },
        {
          path: "sessions/new",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <SessionFormPage />
            </RoleGuard>
          ),
        },
        {
          path: "sessions/:id",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <SessionDetailPage />
            </RoleGuard>
          ),
        },
        {
          path: "sessions/:id/edit",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <SessionFormPage />
            </RoleGuard>
          ),
        },
        {
          path: "attendance",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <AttendanceLogPage />
            </RoleGuard>
          ),
        },

        // 🎓 CERTIFICATES
        {
          // Learners reach this to view/download their OWN certificates (RLS
          // scopes the data); staff manage and issue.
          path: "certificates",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer", "manager", "learner"]}>
              <CertificatesListPage />
            </RoleGuard>
          ),
        },
        {
          path: "certificates/templates",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <CertTemplatesPage />
            </RoleGuard>
          ),
        },
        {
          path: "certificates/verify",
          element: (
            <RoleGuard roles={["admin", "super_admin", "trainer"]}>
              <CertVerifyPage />
            </RoleGuard>
          ),
        },

        // 🤖 AI ASSISTANT
        { path: "ai", element: <AiAssistantPage /> },

        // 📊 ANALYTICS (admin / manager / trainer)
        {
          path: "analytics",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager", "trainer"]}>
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

        // 👤 TRAINERS (admin / manager)
        {
          path: "trainers",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <TrainersListPage />
            </RoleGuard>
          ),
        },

        // 💬 COMMUNICATION (any authenticated user)
        { path: "notifications", element: <NotificationsPage /> },
        { path: "messages", element: <MessagesPage /> },
        { path: "announcements", element: <AnnouncementsPage /> },

        // 💳 PAYMENTS (admin / manager)
        {
          path: "payments",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
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
        {path: "dashboard/crm", element: <CrmDashboard /> },
        {path: "dashboard/eCommerce", element: <EcommerceDashboard /> },
        {path: "dashboard/landing-page", element: <LandingPage /> },
        
        {path: "dashboard/charts", element: <ChartsPage /> },
        {path: "widgets/data", element: <DataWidgetsPage /> },
        {path: "widgets/statistics", element: <StatisticsWidgetsPage /> },
        {path: "docs", element: <Documentation /> },

        // 🛍️ E-COMMERCE
        {path: "eCommerce/product-list", element: <ProductList /> },
        {path: "eCommerce/product-grid", element: <ProductGrid /> },
        {path: "eCommerce/add-product", element: <AddProduct /> },
        {path: "eCommerce/categories", element: <CategoryList /> },
        {path: "eCommerce/order-list", element: <OrderList /> },
        {path: "eCommerce/order-details", element: <OrderDetails /> },
        {path: "eCommerce/customer-list", element: <CustomerList /> },
        {path: "eCommerce/customer-details", element: <CustomerDetails /> },
        {path: "eCommerce/invoice", element: <InvoicePage /> },

        // application routes
        {path: "app/chatbox", element: <ChatBox /> },
        {path: "app/invoice-card", element: <InvoiceCard/> },
        {path: "app/calendar", element: <CalendarPage /> },
        {path: "app/file-manager", element: <FileManagerPage /> },

        // component 
        {path: "components/alerts", element: <AlertsPage /> },
        {path: "components/accordion", element: <AccordionPage/>},
        {path: "components/sooner", element: <SoonerPage/>},
        {path: "components/badges", element: <BadgesPage/>},
        {path: "components/buttons", element: <ButtonsPage/>},
        {path: "components/cards", element: <CardsPage/>},
        {path: "components/list-groups", element: <ListGroupPage/>},
        {path: "components/carousels", element: <CarouselPage/>},
        {path: "components/media-object", element: <AvatarShowcase/>},
        {path: "components/navbars", element: <NavbarsPage/>},
        {path: "components/progress", element: <ProgressPage/>},
        {path: "components/spinners", element: <SpinnerExamples/>},

         // boxicons
        {path: "icons/boxicons", element: <Boxicons/>},
        {path: "icons/bootstrap", element: <IconBootstrap/>},
        {path: "icons/lucide", element: <LucideIconsPage/>},
        {path: "pricing/pricing-tables", element: <PricingPage/>},
        {path: "faq", element: <FAQPage/>},

        // charts
        {path: "charts/recharts", element: <ReChartsPage/>},
        {path: "charts/apex-charts", element: <ApexChartsPage/>},

        // account
        {path: "account/profile", element: <UserProfile/>},
        {path: "account/edit-profile", element: <EditProfile/>},
        {path: "account/password-setting", element: <PasswordSettings/>},
        {path: "account/notifications", element: <NotificationSettings/>},

        // Tables
        {path: "tables/basic-tables", element: <BasicTables/>},
        {path: "tables/advanced-tables", element: <AdvanceTablesPage/>},
        {path: "tables/data-tables", element: <DataTablePage/>},

        // Forms
        {path: "forms/basic-inputs", element: <BasicInput/>},
        {path: "forms/input-groups", element: <FormInputGroup/>},
        {path: "forms/radio-checkboxes", element: <ChecksAndRadios/>},
        {path: "forms/form-layouts", element: <FormLayouts/>},
        {path: "forms/form-wizard", element: <WizardPage/>},
        {path: "forms/text-editor", element: <FormTextEditor/>},
        {path: "forms/file-upload", element: <FileUpload01/>},
        {path: "forms/date-pickers", element: <DatePickerPage/>},
        {path: "forms/select", element: <SelectExamplesPage/>},
        {path: "forms/form-repeat", element: <FormRepeater/>},
        
        
        // 📚 LEARNING (extended)
        { path: "library", element: <LibraryPage /> },
        { path: "courses/paths", element: <LearningPathsPage /> },
        { path: "courses/paths/:id", element: <LearningPathDetailPage /> },
        {
          path: "enrolments",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager", "trainer"]}>
              <EnrolmentsPage />
            </RoleGuard>
          ),
        },

        // 🧑‍🤝‍🧑 PEOPLE (extended)
        {
          path: "staff",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <StaffPage />
            </RoleGuard>
          ),
        },
        {
          path: "cohorts",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <CohortsPage />
            </RoleGuard>
          ),
        },
        {
          path: "users",
          element: (
            <RoleGuard roles={["super_admin"]}>
              <UserManagementPage />
            </RoleGuard>
          ),
        },
        { path: "profile", element: <ProfilePage /> },
        { path: "account/password", element: <PasswordSettingsPage /> },
        { path: "invoices", element: <InvoicesPage /> },
        { path: "payroll", element: <PayrollPage /> },
        {
          path: "files",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager", "trainer"]}>
              <FileManagerPage2 />
            </RoleGuard>
          ),
        },
        {
          path: "cohorts/:id",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <CohortDetailPage />
            </RoleGuard>
          ),
        },

        // 🎥 VIRTUAL TRAINING
        { path: "virtual", element: <VirtualTrainingPage /> },
        { path: "one-to-one", element: <OneToOnePage /> },

        // 📅 SCHEDULING (extended)
        {
          path: "holidays",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager", "trainer"]}>
              <HolidaysPage />
            </RoleGuard>
          ),
        },

        // 💬 COMMUNICATION (extended)
        { path: "forums", element: <ForumsPage /> },
        { path: "forums/:id", element: <ThreadPage /> },
        { path: "qa", element: <QaWallPage /> },
        { path: "qa/:id", element: <ThreadPage /> },
        { path: "feedback", element: <FeedbackPage /> },
        {
          path: "feedback/results",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager", "trainer"]}>
              <FeedbackResultsPage />
            </RoleGuard>
          ),
        },
        {
          path: "email",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <EmailComposerPage />
            </RoleGuard>
          ),
        },
        {
          path: "inbox",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <InboxPage />
            </RoleGuard>
          ),
        },
        {
          path: "inbox/:id",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <MailDetailPage />
            </RoleGuard>
          ),
        },

        // 🛍️ STORE
        {
          path: "store",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <StoreCataloguePage />
            </RoleGuard>
          ),
        },
        {
          path: "store/orders",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <StoreOrdersPage />
            </RoleGuard>
          ),
        },
        {
          path: "store/coupons",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <StoreCouponsPage />
            </RoleGuard>
          ),
        },

        // 🏢 ORGANISATION (extended)
        {
          path: "departments",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
              <DepartmentsPage />
            </RoleGuard>
          ),
        },
        {
          path: "payments/fees",
          element: (
            <RoleGuard roles={["admin", "super_admin", "manager"]}>
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
