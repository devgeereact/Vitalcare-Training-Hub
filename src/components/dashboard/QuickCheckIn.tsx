import { useState, type JSX } from "react"
import { Link } from "react-router-dom"
import { QRCodeSVG } from "qrcode.react"
import { useMutation } from "@tanstack/react-query"
import { QrCode, ChevronRight, CheckCircle2, Loader2, MapPin } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { selfCheckIn } from "@/lib/queries/sessions.queries"

export interface QuickCheckInSession {
  id: string
  title: string
  startsAt: string
}

interface Props {
  /** The next upcoming session to check in to, if one exists. */
  session?: QuickCheckInSession | null
  /** Hide while the upstream sessions query is still loading. */
  loading?: boolean
}

/**
 * Dashboard check-in. Sits alongside the Quick Links cards. Opening it shows a
 * scannable barcode for the session plus an "I'm here" self check-in, with a
 * success popup once attendance is recorded. With no upcoming session it simply
 * links to the sessions list.
 */
export function QuickCheckIn({ session, loading = false }: Props): JSX.Element {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)

  const checkIn = useMutation({
    mutationFn: () => selfCheckIn(session!.id),
    onSuccess: () => {
      setDone(true)
      toast.success("You are checked in", {
        description: session ? session.title : undefined,
      })
    },
    onError: () => toast.error("Could not check you in. Please try again."),
  })

  const detail = loading
    ? "Loading your next session…"
    : session
      ? `${session.title} · ${format(new Date(session.startsAt), "EEE d MMM, HH:mm")}`
      : "Pick a session to record attendance"

  const checkInUrl =
    session && typeof window !== "undefined"
      ? `${window.location.origin}/platform/sessions/${session.id}/checkin`
      : ""

  // Header row shared by both states.
  const header = (
    <span className="flex w-full items-center gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold text-brand-navy">
        <QrCode className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg leading-tight">Quick check-in</span>
        <span className="block truncate text-sm text-white/75">{detail}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-white/70" />
    </span>
  )

  const cardClass =
    "h-full overflow-hidden border-0 bg-gradient-to-br from-[#1b2e6b] to-[#142054] text-white shadow-sm"
  const focus =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b2e6b]"

  // No upcoming session: keep it as a simple link to the sessions list.
  if (!session) {
    return (
      <Card className={cardClass}>
        <CardContent className="p-0">
          <Link to="/platform/sessions" className={`flex p-5 ${focus}`}>
            {header}
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={cardClass}>
        <CardContent className="p-0">
          {/* Whole card is the trigger: opens the check-in dialog. */}
          <button
            type="button"
            onClick={() => {
              setDone(false)
              setOpen(true)
            }}
            className={`flex w-full flex-col gap-4 p-5 text-left transition-opacity hover:opacity-95 ${focus}`}
          >
            {header}
            {/* Scannable barcode: check in, or open Vitalcare on a phone. */}
            <span className="mx-auto rounded-xl bg-white p-3 shadow-sm">
              <QRCodeSVG value={checkInUrl} size={140} fgColor="#1b2e6b" />
            </span>
            <span className="text-center text-xs text-white/70">
              Scan to check in, or open Vitalcare on your phone
            </span>
          </button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="size-12 text-success" />
              <DialogHeader className="items-center">
                <DialogTitle>Checked in</DialogTitle>
                <DialogDescription>
                  Your attendance for {session.title} is recorded.
                </DialogDescription>
              </DialogHeader>
              <Button className="mt-2 w-full" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Check in</DialogTitle>
                <DialogDescription className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {session.title} · {format(new Date(session.startsAt), "EEE d MMM, HH:mm")}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center gap-4 py-2">
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <QRCodeSVG value={checkInUrl} size={176} fgColor="#1b2e6b" />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Scan to check in, or tap below to record your own attendance.
                </p>
                <Button
                  className="w-full"
                  disabled={checkIn.isPending}
                  onClick={() => checkIn.mutate()}
                >
                  {checkIn.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  I am here
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
