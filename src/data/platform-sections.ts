import {
  Gauge,
  BookOpen,
  PenSquare,
  CalendarDays,
  ClipboardCheck,
  Award,
  Users,
  Mail,
  MessageSquare,
  MessagesSquare,
  ShoppingCart,
  Sparkles,
  Building2,
  Settings,
  UserCircle,
  type LucideIcon,
} from "lucide-react"

/**
 * Single source of truth for platform navigation.
 *
 * Each section is one entry in the side nav. A section with more than one
 * visible item also renders a segmented tab bar (SectionTabs) at the top of its
 * pages, the same pattern as the Authoring area. This replaces the old nested
 * sidebar dropdowns: the side nav is flat, and sub-navigation lives on the page.
 */

// Role groups (mirrors the previous sidebar rules).
const STAFF = ["super_admin", "admin", "manager", "trainer", "content_editor"]
const ADMINS = ["super_admin", "admin"]
const MGMT = ["super_admin", "admin", "manager"]
const MGMT_T = ["super_admin", "admin", "manager", "trainer"]
const CONTENT = ["super_admin", "admin", "manager", "trainer", "content_editor"]
const SUPER = ["super_admin"]

export interface SectionItem {
  label: string
  to: string
  /** Route prefix that marks this item active. Longest match wins. */
  prefix: string
  /** Roles allowed to see this item. Undefined = every signed-in user. */
  roles?: string[]
}

export interface PlatformSection {
  id: string
  title: string
  icon: LucideIcon
  /** Roles allowed to see the section at all. Undefined = everyone. */
  roles?: string[]
  items: SectionItem[]
}

export const PLATFORM_SECTIONS: PlatformSection[] = [
  {
    id: "overview",
    title: "Overview",
    icon: Gauge,
    items: [
      { label: "Dashboard", to: "/platform/dashboard", prefix: "/platform/dashboard" },
      { label: "Analytics", to: "/platform/analytics", prefix: "/platform/analytics", roles: MGMT_T },
    ],
  },
  {
    id: "learning",
    title: "Learning",
    icon: BookOpen,
    items: [
      { label: "Courses", to: "/platform/courses", prefix: "/platform/courses" },
      { label: "Learning Paths", to: "/platform/courses/paths", prefix: "/platform/courses/paths" },
      { label: "Assessment Results", to: "/platform/assessments/results", prefix: "/platform/assessments/results", roles: MGMT_T },
      { label: "Virtual Training", to: "/platform/virtual", prefix: "/platform/virtual" },
      { label: "1:1 Sessions", to: "/platform/one-to-one", prefix: "/platform/one-to-one" },
      { label: "Enrolments", to: "/platform/enrolments", prefix: "/platform/enrolments", roles: MGMT_T },
    ],
  },
  {
    id: "authoring",
    title: "Authoring",
    icon: PenSquare,
    roles: CONTENT,
    items: [
      { label: "Course Builder", to: "/platform/courses/builder", prefix: "/platform/courses/builder", roles: CONTENT },
      { label: "Quiz Builder", to: "/platform/assessments/builder", prefix: "/platform/assessments/builder", roles: CONTENT },
      { label: "Resources", to: "/platform/library", prefix: "/platform/library" },
    ],
  },
  {
    id: "calendar",
    title: "Calendar",
    icon: CalendarDays,
    items: [{ label: "Calendar", to: "/platform/calendar", prefix: "/platform/calendar" }],
  },
  {
    id: "attendance",
    title: "Attendance",
    icon: ClipboardCheck,
    items: [
      { label: "Sessions", to: "/platform/sessions", prefix: "/platform/sessions" },
      { label: "Trainer Timetable", to: "/platform/timetable", prefix: "/platform/timetable", roles: MGMT_T },
      { label: "Attendance Log", to: "/platform/attendance", prefix: "/platform/attendance", roles: MGMT_T },
    ],
  },
  {
    id: "certificates",
    title: "Certificates",
    icon: Award,
    items: [
      { label: "Certificates", to: "/platform/certificates", prefix: "/platform/certificates" },
      { label: "Verification", to: "/platform/certificates/verify", prefix: "/platform/certificates/verify" },
      { label: "Templates", to: "/platform/certificates/templates", prefix: "/platform/certificates/templates", roles: CONTENT },
    ],
  },
  {
    id: "users",
    title: "User Management",
    icon: Users,
    roles: MGMT_T,
    items: [
      { label: "All Accounts", to: "/platform/users", prefix: "/platform/users", roles: ADMINS },
      { label: "Learners", to: "/platform/learners", prefix: "/platform/learners", roles: MGMT_T },
      { label: "Trainers", to: "/platform/trainers", prefix: "/platform/trainers", roles: MGMT },
      { label: "Cohorts & Teams", to: "/platform/cohorts", prefix: "/platform/cohorts", roles: MGMT },
    ],
  },
  {
    id: "email",
    title: "Email",
    icon: Mail,
    items: [{ label: "Email", to: "/platform/email", prefix: "/platform/email" }],
  },
  {
    id: "chat",
    title: "Chat",
    icon: MessageSquare,
    items: [{ label: "Chat", to: "/platform/messages", prefix: "/platform/messages" }],
  },
  {
    id: "communication",
    title: "Communication",
    icon: MessagesSquare,
    items: [
      { label: "Notifications", to: "/platform/notifications", prefix: "/platform/notifications" },
      { label: "Announcements", to: "/platform/announcements", prefix: "/platform/announcements" },
      { label: "Forum", to: "/platform/forums", prefix: "/platform/forums" },
      { label: "Q&A", to: "/platform/qa", prefix: "/platform/qa" },
      { label: "Feedback", to: "/platform/feedback/results", prefix: "/platform/feedback" },
    ],
  },
  {
    id: "store",
    title: "Store",
    icon: ShoppingCart,
    items: [
      { label: "Catalogue", to: "/platform/store", prefix: "/platform/store" },
      { label: "Orders", to: "/platform/store/orders", prefix: "/platform/store/orders", roles: MGMT },
      { label: "Coupons", to: "/platform/store/coupons", prefix: "/platform/store/coupons", roles: MGMT },
    ],
  },
  {
    id: "ai",
    title: "AI Assistant",
    icon: Sparkles,
    items: [{ label: "AI Assistant", to: "/platform/ai", prefix: "/platform/ai" }],
  },
  {
    id: "organisation",
    title: "Organisation",
    icon: Building2,
    roles: STAFF,
    items: [
      { label: "Departments", to: "/platform/departments", prefix: "/platform/departments", roles: MGMT },
      { label: "Staff", to: "/platform/staff", prefix: "/platform/staff", roles: MGMT },
      { label: "Plan", to: "/platform/payments", prefix: "/platform/payments", roles: ADMINS },
      { label: "Invoices", to: "/platform/invoices", prefix: "/platform/invoices", roles: MGMT },
      { label: "Payroll", to: "/platform/payroll", prefix: "/platform/payroll", roles: STAFF },
      { label: "File Manager", to: "/platform/files", prefix: "/platform/files", roles: STAFF },
      { label: "Audit Log", to: "/platform/audit", prefix: "/platform/audit", roles: SUPER },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    // Single entry: the Settings page provides its own in-place tabs
    // (Account, Appearance, Notifications, Integrations, Password).
    items: [
      { label: "Settings", to: "/platform/settings", prefix: "/platform/settings" },
    ],
  },
  {
    id: "profile",
    title: "Profile",
    icon: UserCircle,
    items: [{ label: "Profile", to: "/platform/profile", prefix: "/platform/profile" }],
  },
]

/** Whether a role may see an entry with the given role list. */
function roleAllows(roles: string[] | undefined, role: string | null): boolean {
  return !roles || (role !== null && roles.includes(role))
}

/** Items in a section the given role may see. */
export function visibleItems(section: PlatformSection, role: string | null): SectionItem[] {
  if (!roleAllows(section.roles, role)) return []
  return section.items.filter((item) => roleAllows(item.roles, role))
}

export interface SidebarEntry {
  id: string
  title: string
  url: string
  icon: LucideIcon
}

/** One flat side-nav entry per visible section, linking to its first item. */
export function sidebarEntries(role: string | null): SidebarEntry[] {
  const out: SidebarEntry[] = []
  for (const section of PLATFORM_SECTIONS) {
    const items = visibleItems(section, role)
    if (items.length === 0) continue
    out.push({ id: section.id, title: section.title, url: items[0].to, icon: section.icon })
  }
  return out
}

/**
 * Find the section that owns a pathname by longest matching item prefix. This
 * resolves overlapping routes (e.g. /platform/courses/builder belongs to
 * Authoring, not Learning's broader /platform/courses).
 */
export function findSection(pathname: string): PlatformSection | null {
  let best: { section: PlatformSection; len: number } | null = null
  for (const section of PLATFORM_SECTIONS) {
    for (const item of section.items) {
      const matches = pathname === item.prefix || pathname.startsWith(`${item.prefix}/`)
      if (matches && (!best || item.prefix.length > best.len)) {
        best = { section, len: item.prefix.length }
      }
    }
  }
  return best?.section ?? null
}

/** The active item prefix for a pathname (longest match), for tab highlighting. */
export function activePrefix(pathname: string): string | null {
  let best: string | null = null
  for (const section of PLATFORM_SECTIONS) {
    for (const item of section.items) {
      const matches = pathname === item.prefix || pathname.startsWith(`${item.prefix}/`)
      if (matches && (!best || item.prefix.length > best.length)) best = item.prefix
    }
  }
  return best
}
