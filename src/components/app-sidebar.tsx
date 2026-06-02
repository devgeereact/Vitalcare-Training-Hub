import {
  Gauge,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  Award,
  Users,
  MessagesSquare,
  Mail,
  MessageSquare,
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

// ─── Role-based nav visibility ───────────────────────────────────────────────
// Undefined roles on an entry = visible to every signed-in user (incl. learner).
const STAFF = ["super_admin", "admin", "manager", "trainer", "content_editor"]
const ADMINS = ["super_admin", "admin"]
const MGMT = ["super_admin", "admin", "manager"]
const MGMT_T = ["super_admin", "admin", "manager", "trainer"]
const CONTENT = ["super_admin", "admin", "trainer", "content_editor"]
const SUPER = ["super_admin"]

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
        { title: "Analytics", url: "/platform/analytics", roles: MGMT_T },
      ],
    },
    {
      title: "Learning",
      url: "#",
      icon: BookOpen,
      items: [
        { title: "Courses", url: "/platform/courses" },
        { title: "Learning Paths", url: "/platform/courses/paths" },
        { title: "Authoring", url: "/platform/courses/builder", roles: CONTENT },
        { title: "Assessment Results", url: "/platform/assessments/results", roles: MGMT_T },
        { title: "Resource Library", url: "/platform/library" },
        { title: "Virtual Training", url: "/platform/virtual" },
        { title: "1:1 Sessions", url: "/platform/one-to-one" },
        { title: "Enrolments", url: "/platform/enrolments", roles: MGMT_T },
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
        { title: "Trainer Timetable", url: "/platform/timetable", roles: MGMT_T },
        { title: "Attendance Log", url: "/platform/attendance", roles: MGMT_T },
      ],
    },
    {
      title: "Certificates",
      url: "#",
      icon: Award,
      items: [
        { title: "Certificates", url: "/platform/certificates" },
        { title: "Verification", url: "/platform/certificates/verify" },
        { title: "Templates", url: "/platform/certificates/templates", roles: CONTENT },
      ],
    },
    {
      title: "User Management",
      url: "#",
      icon: Users,
      items: [
        { title: "All Accounts", url: "/platform/users", roles: ADMINS },
        { title: "Learners", url: "/platform/learners", roles: MGMT_T },
        { title: "Trainers", url: "/platform/trainers", roles: MGMT },
        { title: "Cohorts & Teams", url: "/platform/cohorts", roles: MGMT },
      ],
    },
    {
      title: "Email",
      url: "/platform/email",
      icon: Mail,
      roles: STAFF,
    },
    {
      title: "Chat",
      url: "/platform/messages",
      icon: MessageSquare,
    },
    {
      title: "Communication",
      url: "/platform/announcements",
      icon: MessagesSquare,
    },
    {
      title: "Store",
      url: "#",
      icon: ShoppingCart,
      items: [
        { title: "Catalogue", url: "/platform/store" },
        { title: "Orders", url: "/platform/store/orders", roles: MGMT },
        { title: "Coupons", url: "/platform/store/coupons", roles: MGMT },
      ],
    },
    {
      title: "AI Assistant",
      url: "/platform/ai",
      icon: Sparkles,
      roles: STAFF,
    },
    {
      title: "Organisation",
      url: "#",
      icon: Building2,
      items: [
        { title: "Departments", url: "/platform/departments", roles: MGMT },
        { title: "Staff", url: "/platform/staff", roles: MGMT },
        { title: "Plan", url: "/platform/payments", roles: ADMINS },
        { title: "Invoices", url: "/platform/invoices", roles: MGMT },
        { title: "Payroll", url: "/platform/payroll", roles: STAFF },
        { title: "File Manager", url: "/platform/files", roles: STAFF },
        { title: "Audit Log", url: "/platform/audit", roles: SUPER },
      ],
    },
    {
      title: "Settings",
      url: "/platform/settings",
      icon: Settings,
    },
    {
      title: "Profile",
      url: "/platform/profile",
      icon: UserCircle,
    },
  ],
}

type RawNavItem = {
  title: string
  url: string
  icon?: typeof Gauge
  isActive?: boolean
  roles?: string[]
  items?: RawNavItem[]
}

/** Drop nav entries the current role may not see; hide groups left empty. */
function navForRole(items: RawNavItem[], role: string | null): RawNavItem[] {
  const allowed = (it: RawNavItem) => !it.roles || (role !== null && it.roles.includes(role))
  const out: RawNavItem[] = []
  for (const group of items) {
    if (!allowed(group)) continue
    if (group.items && group.items.length > 0) {
      const children = group.items.filter(allowed)
      if (children.length === 0) continue
      out.push({ ...group, items: children })
    } else {
      out.push(group)
    }
  }
  return out
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onHoverChange?: (value: boolean) => void
}

export function AppSidebar({ onHoverChange, ...props }: AppSidebarProps) {
  const { profile, role } = useUser()
  const navItems = navForRole(data.navMain as RawNavItem[], role)
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
          <NavMain items={navItems} />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border h-16 justify-center">
          <NavUser user={currentUser} />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </div>
  )
}
