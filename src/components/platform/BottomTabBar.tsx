import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, BookOpen, CalendarDays, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Dashboard", to: "/platform/dashboard", icon: LayoutDashboard },
  { label: "Courses", to: "/platform/courses", icon: BookOpen },
  { label: "Calendar", to: "/platform/calendar", icon: CalendarDays },
  { label: "Alerts", to: "/platform/notifications", icon: Bell },
  { label: "Profile", to: "/platform/profile", icon: User },
]

export default function BottomTabBar() {
  const { pathname } = useLocation()

  const isActive = (to: string) =>
    pathname === to || pathname.startsWith(`${to}/`)

  return (
    <nav
      aria-label="Platform"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = isActive(tab.to)
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-inset",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <tab.icon className={cn("h-5 w-5", active && "text-primary")} />
                <span>{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
