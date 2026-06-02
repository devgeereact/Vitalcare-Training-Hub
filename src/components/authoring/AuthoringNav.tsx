import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { BookOpen, ClipboardList, FolderOpen } from "lucide-react"

import { cn } from "@/lib/utils"

interface AuthoringNavItem {
  to: string
  label: string
  icon: typeof BookOpen
  /** Match nested routes (e.g. builder/:id) as active too. */
  matchPrefix: string
}

const NAV_ITEMS: AuthoringNavItem[] = [
  {
    to: "/platform/courses/builder",
    label: "Course Builder",
    icon: BookOpen,
    matchPrefix: "/platform/courses/builder",
  },
  {
    to: "/platform/assessments/builder",
    label: "Quiz Builder",
    icon: ClipboardList,
    matchPrefix: "/platform/assessments/builder",
  },
  {
    to: "/platform/library",
    label: "Resources",
    icon: FolderOpen,
    matchPrefix: "/platform/library",
  },
]

/**
 * Shared segmented sub-navigation for the Authoring area. Course Builder, Quiz
 * Builder and Resources each render this under a single "Authoring" heading so
 * the three pages feel like one cohesive area. Routes stay untouched; the pages
 * render this themselves.
 *
 * Active state is navy on card, focus rings are gold, and the bar scrolls
 * horizontally on narrow screens. Prefix matching keeps the right pill active
 * on nested builder routes (e.g. /courses/builder/:id).
 */
export default function AuthoringNav(): ReactNode {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Authoring sections"
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
