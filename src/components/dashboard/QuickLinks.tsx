import type { JSX } from "react"
import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import {
  Users,
  BookOpen,
  CalendarDays,
  Receipt,
  Megaphone,
  BarChart3,
  CalendarClock,
  Wrench,
  GraduationCap,
  Award,
  FolderOpen,
  CalendarRange,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

export interface QuickLinkItem {
  label: string
  to: string
  icon: LucideIcon
}

const ADMIN_LINKS: readonly QuickLinkItem[] = [
  { label: "Learners", to: "/platform/learners", icon: Users },
  { label: "Courses", to: "/platform/courses", icon: BookOpen },
  { label: "Sessions", to: "/platform/sessions", icon: CalendarDays },
  { label: "Invoices", to: "/platform/invoices", icon: Receipt },
  { label: "Announcements", to: "/platform/announcements", icon: Megaphone },
  { label: "Reports", to: "/platform/analytics", icon: BarChart3 },
]

const TRAINER_LINKS: readonly QuickLinkItem[] = [
  { label: "My sessions", to: "/platform/my-sessions", icon: CalendarDays },
  { label: "Timetable", to: "/platform/timetable", icon: CalendarClock },
  { label: "Course builder", to: "/platform/courses/builder", icon: Wrench },
  { label: "Learners", to: "/platform/learners", icon: Users },
]

const LEARNER_LINKS: readonly QuickLinkItem[] = [
  { label: "My courses", to: "/platform/courses", icon: GraduationCap },
  { label: "Calendar", to: "/platform/calendar", icon: CalendarRange },
  { label: "Certificates", to: "/platform/certificates", icon: Award },
  { label: "Resource library", to: "/platform/library", icon: FolderOpen },
]

export type QuickLinksRole = "admin" | "trainer" | "learner"

const LINKS_BY_ROLE: Record<QuickLinksRole, readonly QuickLinkItem[]> = {
  admin: ADMIN_LINKS,
  trainer: TRAINER_LINKS,
  learner: LEARNER_LINKS,
}

/** Compact card of role-aware shortcuts to common destinations. */
export function QuickLinks({ role }: { role: QuickLinksRole }): JSX.Element {
  const items = LINKS_BY_ROLE[role]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick links</CardTitle>
        <CardDescription>Jump to where you work most</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-background p-4 text-center transition-colors hover:border-brand-gold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy transition-colors group-hover:bg-brand-navy group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <span className="text-xs font-medium text-foreground">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
