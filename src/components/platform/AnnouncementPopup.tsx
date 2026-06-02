import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Megaphone, CalendarClock, Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useUnacknowledged, useAcknowledge } from "@/lib/queries/communication.queries"

/** Shows unacknowledged announcements one at a time as a modal. */
export default function AnnouncementPopup() {
  const { user } = useAuth()
  const { data } = useUnacknowledged(user?.id)
  const ack = useAcknowledge(user?.id)
  const [index, setIndex] = useState(0)
  const [withReminders, setWithReminders] = useState(true)

  const list = data ?? []
  const current = list[index]
  if (!current) return null

  function acknowledge() {
    ack
      .mutateAsync({
        announcementId: current.id,
        title: current.title,
        actionAt: current.action_at,
        addReminders: withReminders,
      })
      .then(() => {
        if (current.action_at && withReminders) toast.success("Reminders set")
        setIndex((i) => i + 1)
      })
      .catch(() => toast.error("Could not acknowledge"))
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="[&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
              <Megaphone className="size-4" />
            </span>
            {current.title}
          </DialogTitle>
          <DialogDescription>
            {current.authorName} ·{" "}
            {format(new Date(current.published_at ?? current.created_at), "d MMM yyyy, HH:mm")}
          </DialogDescription>
        </DialogHeader>

        <p className="whitespace-pre-wrap text-sm text-foreground">{current.body}</p>

        {current.action_at && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <CalendarClock className="size-4 text-brand-navy" />
              Action due {format(new Date(current.action_at), "EEE d MMM yyyy, HH:mm")}
            </p>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={withReminders}
                onChange={(e) => setWithReminders(e.target.checked)}
                className="size-4 accent-[#1b2e6b]"
              />
              Remind me (day before, 2 hours before, and on time)
            </label>
          </div>
        )}

        <DialogFooter>
          {list.length > 1 && (
            <span className="mr-auto self-center text-xs text-muted-foreground">
              {index + 1} of {list.length}
            </span>
          )}
          <Button onClick={acknowledge} disabled={ack.isPending}>
            {ack.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Acknowledge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
