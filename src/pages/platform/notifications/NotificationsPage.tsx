import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  Bell,
  BellRing,
  AlertCircle,
  CheckCheck,
  GraduationCap,
  CalendarDays,
  Award,
  MessageSquare,
  Megaphone,
  Settings as SettingsIcon,
  Info,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import {
  useNotifications,
  useMarkNotification,
} from "@/lib/queries/communication.queries"
import { pushSupported, isPushEnabled, enablePush } from "@/lib/push"
import type { NotificationType } from "@/types/database.types"

function PushToggle({ userId }: { userId: string | undefined }) {
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    isPushEnabled().then(setEnabled)
  }, [])
  if (!pushSupported() || enabled || !userId) return null
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={() => {
        setBusy(true)
        enablePush(userId)
          .then(() => {
            setEnabled(true)
            toast.success("Push notifications enabled")
          })
          .catch((e) =>
            toast.error("Could not enable push", {
              description: e instanceof Error ? e.message : undefined,
            }),
          )
          .finally(() => setBusy(false))
      }}
    >
      <BellRing className="mr-2 size-4" /> Enable push
    </Button>
  )
}

const ICONS: Record<NotificationType, typeof Bell> = {
  info: Info,
  enrolment: GraduationCap,
  session: CalendarDays,
  certificate: Award,
  message: MessageSquare,
  announcement: Megaphone,
  system: SettingsIcon,
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useNotifications(user?.id)
  const mark = useMarkNotification(user?.id)
  const unread = (data ?? []).filter((n) => !n.read_at).length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "You are all caught up."}
          </p>
        </div>
        <div className="flex gap-2">
          <PushToggle userId={user?.id} />
          {unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={mark.isPending}
              onClick={() => mark.mutate({ all: true })}
            >
              <CheckCheck className="mr-2 size-4" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load notifications. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Bell className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                No notifications yet. Updates about courses, sessions and
                certificates will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data!.map((n) => {
                const Icon = ICONS[n.type] ?? Info
                const body = (
                  <div className="flex items-start gap-3 px-5 py-4">
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                        n.read_at
                          ? "bg-muted text-muted-foreground"
                          : "bg-brand-navy/10 text-brand-navy",
                      )}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm",
                          n.read_at ? "text-foreground" : "font-semibold text-foreground",
                        )}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read_at && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-gold" />
                    )}
                  </div>
                )
                return (
                  <li
                    key={n.id}
                    onMouseEnter={() => !n.read_at && mark.mutate({ id: n.id })}
                  >
                    {n.link ? (
                      <Link to={n.link} className="block hover:bg-muted/50">
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
