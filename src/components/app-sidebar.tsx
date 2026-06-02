import {
  Gauge,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  Award,
  Users,
  MessagesSquare,
  Sparkles,
  Building2,
  ShoppingCart,
  UserCircle,
  Settings,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useUser } from "@/hooks/use-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"

// Vitalcare Training Hub — platform navigation.
// All URLs are absolute under /platform. Modules not yet built resolve to the
// platform catch-all (a branded "in development" notice) until later phases.
const data = {
  user: {
    name: "Gideon Akinlotan",
    email: "gideon@vitalcare.uk",
    avatar: "",
  },
  navMain: [
    {
      title: "Overview",
      url: "#",
      icon: Gauge,
      isActive: true,
      items: [
        { title: "Dashboard", url: "/platform/dashboard" },
        { title: "Analytics", url: "/platform/analytics" },
      ],
    },
    {
      title: "Learning",
      url: "#",
      icon: BookOpen,
      items: [
        { title: "Courses", url: "/platform/courses" },
        { title: "Learning Paths", url: "/platform/courses/paths" },
        { title: "Course Builder", url: "/platform/courses/builder" },
        { title: "Quiz Builder", url: "/platform/assessments/builder" },
        { title: "Assessment Results", url: "/platform/assessments/results" },
        { title: "Resource Library", url: "/platform/library" },
        { title: "Virtual Training", url: "/platform/virtual" },
        { title: "1:1 Sessions", url: "/platform/one-to-one" },
        { title: "Enrolments", url: "/platform/enrolments" },
      ],
    },
    {
      title: "Calendar",
      url: "/platform/calendar",
      icon: CalendarDays,
    },
    {
      title: "Attendance",
      url: "#",
      icon: ClipboardCheck,
      items: [
        { title: "Sessions", url: "/platform/sessions" },
        { title: "Trainer Timetable", url: "/platform/timetable" },
        { title: "Attendance Log", url: "/platform/attendance" },
        { title: "Holidays", url: "/platform/holidays" },
      ],
    },
    {
      title: "Certificates",
      url: "#",
      icon: Award,
      items: [
        { title: "Certificates", url: "/platform/certificates" },
        { title: "Verification", url: "/platform/certificates/verify" },
        { title: "Templates", url: "/platform/certificates/templates" },
      ],
    },
    {
      title: "User Management",
      url: "#",
      icon: Users,
      items: [
        { title: "All Accounts", url: "/platform/users" },
        { title: "Learners", url: "/platform/learners" },
        { title: "Trainers", url: "/platform/trainers" },
        { title: "Cohorts & Teams", url: "/platform/cohorts" },
      ],
    },
    {
      title: "Communication",
      url: "#",
      icon: MessagesSquare,
      items: [
        { title: "Email", url: "/platform/email" },
        { title: "Chat", url: "/platform/messages" },
        { title: "Announcements", url: "/platform/announcements" },
        { title: "Notifications", url: "/platform/notifications" },
        { title: "Forum", url: "/platform/forums" },
        { title: "Q&A", url: "/platform/qa" },
        { title: "Feedback", url: "/platform/feedback/results" },
      ],
    },
    {
      title: "Store",
      url: "#",
      icon: ShoppingCart,
      items: [
        { title: "Catalogue", url: "/platform/store" },
        { title: "Orders", url: "/platform/store/orders" },
        { title: "Coupons", url: "/platform/store/coupons" },
      ],
    },
    {
      title: "AI Assistant",
      url: "/platform/ai",
      icon: Sparkles,
    },
    {
      title: "Organisation",
      url: "#",
      icon: Building2,
      items: [
        { title: "Departments", url: "/platform/departments" },
        { title: "Staff", url: "/platform/staff" },
        { title: "Plan", url: "/platform/payments" },
        { title: "Invoices", url: "/platform/invoices" },
        { title: "Payroll", url: "/platform/payroll" },
        { title: "File Manager", url: "/platform/files" },
        { title: "Audit Log", url: "/platform/audit" },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        { title: "General", url: "/platform/settings" },
        { title: "Integrations", url: "/platform/settings/integrations" },
        { title: "Password", url: "/platform/account/password" },
      ],
    },
    {
      title: "Profile",
      url: "/platform/profile",
      icon: UserCircle,
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onHoverChange?: (value: boolean) => void
}

export function AppSidebar({ onHoverChange, ...props }: AppSidebarProps) {
  const { profile } = useUser()
  const currentUser = {
    name:
      profile?.full_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "Account",
    email: profile?.email ?? "",
    avatar: profile?.avatar_url ?? "",
  }
  return (
    <div
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader className="border-b border-sidebar-border h-16">
          <SidebarMenuButton size="lg" asChild className="px-2 py-3">
            <a href="/">
              <div className="flex aspect-square size-8 items-center justify-center mx-auto rounded-lg overflow-hidden">
                <img
                  src="/logos/logo-round-white.svg"
                  alt="Vitalcare Training Hub"
                  className="size-8"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Vitalcare Training Hub</span>
                <span className="truncate text-xs opacity-80">CSTF-aligned TMS</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarHeader>

        <SidebarContent>
          <NavMain items={data.navMain} />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border h-16 justify-center">
          <NavUser user={currentUser} />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </div>
  )
}
