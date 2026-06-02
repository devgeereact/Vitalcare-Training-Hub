import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { Bell, Megaphone, MessagesSquare, HelpCircle, Star } from "lucide-react"

import { cn } from "@/lib/utils"

interface CommsNavItem {
  to: string
  label: string
  icon: typeof Megaphone
  /** Match nested routes (e.g. thread pages) as active too. */
  matchPrefix: string
}

const NAV_ITEMS: CommsNavItem[] = [
  {
    to: "/platform/notifications",
    label: "Notifications",
    icon: Bell,
    matchPrefix: "/platform/notifications",
  },
  {
    to: "/platform/announcements",
    label: "Announcements",
    icon: Megaphone,
    matchPrefix: "/platform/announcements",
  },
  {
    to: "/platform/forums",
    label: "Forum",
    icon: MessagesSquare,
    matchPrefix: "/platform/forums",
  },
  {
    to: "/platform/qa",
    label: "Q&A",
    icon: HelpCircle,
    matchPrefix: "/platform/qa",
  },
  {
    to: "/platform/feedback/results",
    label: "Feedback",
    icon: Star,
    matchPrefix: "/platform/feedback",
  },
]

/**
 * Shared segmented sub-navigation for the Communication area. Announcements,
 * Forum, Q&A and Feedback each render this under a single "Communication"
 * heading so the four pages feel like one cohesive area. Routes stay untouched;
 * the pages render this themselves.
 *
 * Active state is navy on white, focus rings are gold, and the bar scrolls
 * horizontally on narrow screens.
 */
export default function CommsNav(): ReactNode {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Communication sections"
      className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active =
          pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`)
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2",
              active
                ? "bg-card text-brand-navy shadow-sm"
                : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
