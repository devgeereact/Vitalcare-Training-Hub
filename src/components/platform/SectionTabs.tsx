import { Link, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import {
  findSection,
  visibleItems,
  activePrefix,
} from "@/data/platform-sections"

/**
 * Segmented sub-navigation for the active platform section, rendered once in the
 * app layout above the page. Mirrors the Authoring tab pattern: a single section
 * heading worth of tabs, navy active pill on a card, gold focus rings, scrolls
 * horizontally on narrow screens. Renders nothing for single-page sections.
 */
export default function SectionTabs(): React.ReactElement | null {
  const { pathname } = useLocation()
  const { role } = useUser()

  const section = findSection(pathname)
  if (!section) return null

  const items = visibleItems(section, role)
  if (items.length < 2) return null

  const active = activePrefix(pathname)

  return (
    <nav
      aria-label={`${section.title} sections`}
      className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1"
    >
      {items.map((item) => {
        const isActive = item.prefix === active
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2",
              isActive
                ? "bg-card text-brand-navy shadow-sm"
                : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
