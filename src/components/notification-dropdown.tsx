import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  Info,
  GraduationCap,
  CalendarDays,
  Award,
  MessageSquare,
  Megaphone,
  Settings as SettingsIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import {
  useNotifications,
  useMarkNotification,
} from "@/lib/queries/communication.queries"
import type { NotificationType } from "@/types/database.types"

const ICONS: Record<NotificationType, typeof Bell> = {
  info: Info,
  enrolment: GraduationCap,
  session: CalendarDays,
  certificate: Award,
  message: MessageSquare,
  announcement: Megaphone,
  system: SettingsIcon,
}

export function NotificationDropdown() {
  const { user } = useAuth()
  const { data } = useNotifications(user?.id)
  const mark = useMarkNotification(user?.id)
  const items = data ?? []
  const unreadCount = items.filter((n) => !n.read_at).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full [&_svg]:size-5 h-10 w-10 p-0"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          >
            <Bell />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl border shadow-xl">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => mark.mutate({ all: true })}
              className="text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="size-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">You are all caught up.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {items.slice(0, 8).map((item) => {
                const Icon = ICONS[item.type] ?? Info
                const inner = (
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors",
                      item.read_at ? "hover:bg-muted/50" : "bg-muted/50 hover:bg-muted",
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                      <Icon className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="truncate text-sm font-medium leading-none">
                        {item.title}
                      </p>
                      {item.body && (
                        <p className="truncate text-xs text-muted-foreground">
                          {item.body}
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                )
                return item.link ? (
                  <Link
                    key={item.id}
                    to={item.link}
                    onClick={() => !item.read_at && mark.mutate({ id: item.id })}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={item.id}>{inner}</div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t p-2">
          <Button asChild variant="ghost" className="w-full text-sm">
            <Link to="/platform/notifications">View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
