import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { KeyRound, Plug, SlidersHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"

interface SettingsNavItem {
  to: string
  label: string
  icon: typeof SlidersHorizontal
  adminOnly?: boolean
  /** Match this route exactly (used for the index route). */
  end?: boolean
}

const NAV_ITEMS: SettingsNavItem[] = [
  { to: "/platform/settings", label: "General", icon: SlidersHorizontal, end: true },
  {
    to: "/platform/settings/integrations",
    label: "Integrations",
    icon: Plug,
    adminOnly: true,
  },
  { to: "/platform/account/password", label: "Password", icon: KeyRound },
]

interface SettingsShellProps {
  /** Optional override for the page description shown under the title. */
  description?: string
  children: ReactNode
}

/**
 * Shared shell for every Settings sub-page. Renders a consistent header and a
 * segmented sub-navigation so General, Integrations and Password feel like one
 * area. Each page renders this itself, so routes stay untouched.
 */
export default function SettingsShell({
  description = "Manage your account, integrations and how the platform looks.",
  children,
}: SettingsShellProps): ReactNode {
  const { isAdmin } = useUser()
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-3xl text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </header>

      <nav
        aria-label="Settings sections"
        className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1"
      >
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2",
                  isActive
                    ? "bg-card text-brand-navy shadow-sm"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-6">{children}</div>
    </div>
  )
}
