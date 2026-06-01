import {
  Gauge,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  Award,
  Users,
  MessagesSquare,
  Video,
  Sparkles,
  Building2,
  ShoppingCart,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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
        { title: "My Courses", url: "/platform/courses" },
        { title: "All Courses", url: "/platform/courses/manage" },
        { title: "Course Builder", url: "/platform/courses/builder" },
        { title: "Learning Paths", url: "/platform/courses/paths" },
        { title: "Resource Library", url: "/platform/library" },
        { title: "Enrolments", url: "/platform/enrolments" },
      ],
    },
    {
      title: "Assessments",
      url: "#",
      icon: ClipboardCheck,
      items: [
        { title: "Quiz Builder", url: "/platform/assessments/builder" },
        { title: "Assessment Results", url: "/platform/assessments/results" },
      ],
    },
    {
      title: "Attendance",
      url: "#",
      icon: CalendarDays,
      items: [
        { title: "Calendar", url: "/platform/calendar" },
        { title: "Sessions", url: "/platform/sessions" },
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
        { title: "Templates", url: "/platform/certificates/templates" },
      ],
    },
    {
      title: "People",
      url: "#",
      icon: Users,
      items: [
        { title: "Learners", url: "/platform/learners" },
        { title: "Trainers", url: "/platform/trainers" },
        { title: "Cohorts & Teams", url: "/platform/cohorts" },
        { title: "Staff", url: "/platform/staff" },
      ],
    },
    {
      title: "Communication",
      url: "#",
      icon: MessagesSquare,
      items: [
        { title: "Notifications", url: "/platform/notifications" },
        { title: "Messages", url: "/platform/messages" },
        { title: "Announcements", url: "/platform/announcements" },
        { title: "Forums", url: "/platform/forums" },
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
      title: "Virtual Training",
      url: "/platform/virtual",
      icon: Video,
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
        { title: "Analytics", url: "/platform/analytics/org" },
        { title: "Departments", url: "/platform/departments" },
        { title: "Payments", url: "/platform/payments" },
        { title: "Fees & Receipts", url: "/platform/payments/fees" },
        { title: "Settings", url: "/platform/settings" },
        { title: "Audit Log", url: "/platform/audit" },
      ],
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onHoverChange?: (value: boolean) => void
}

export function AppSidebar({ onHoverChange, ...props }: AppSidebarProps) {
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
          <NavUser user={data.user} />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </div>
  )
}
