import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Video,
  AlertCircle,
  Clock,
  Plus,
  PlayCircle,
  CheckCircle2,
  Loader2,
  Hourglass,
  ShieldCheck,
  Archive,
  CalendarClock,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/marketing/Pagination"
import { useUser } from "@/hooks/use-user"
import { useAuth } from "@/hooks/use-auth"
import {
  useVirtualSessions,
  useMyJoinRequests,
  usePendingJoinRequests,
  useRequestJoin,
  useDecideJoin,
  getSessionJoinLink,
  type JoinStatus,
} from "@/lib/queries/virtual.queries"
import { selfCheckIn } from "@/lib/queries/sessions.queries"
import type { TrainingSession } from "@/types/database.types"

const PAGE_SIZE = 12

type Phase = "live" | "upcoming" | "past"

function phaseOf(s: TrainingSession, now: number): Phase {
  const start = new Date(s.starts_at).getTime()
  const end = new Date(s.ends_at).getTime()
  if (now > end) return "past"
  if (now >= start) return "live"
  return "upcoming"
}

export default function VirtualTrainingPage() {
  const { isAdmin, isTrainer } = useUser()
  const { user } = useAuth()
  const userId = user?.id
  const canManage = isAdmin || isTrainer
  const canApprove = isAdmin

  const { data, isLoading, isError, refetch } = useVirtualSessions()
  const myRequests = useMyJoinRequests(canManage ? undefined : userId)
  const pending = usePendingJoinRequests(canApprove)
  const requestJoin = useRequestJoin(userId)
  const decide = useDecideJoin(userId)

  const [tab, setTab] = useState<"active" | "archive">("active")
  const [page, setPage] = useState(1)
  const [joining, setJoining] = useState<string | null>(null)

  const now = Date.now()

  // Past sessions are archived: kept in the database but hidden from learners.
  // Staff can switch to the Archive tab to review them for records.
  const sessions = useMemo(() => {
    const all = data ?? []
    if (tab === "archive" && canManage) {
      return all
        .filter((s) => phaseOf(s, now) === "past")
        .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
    }
    return all
      .filter((s) => phaseOf(s, now) !== "past")
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [data, tab, canManage, now])

  const pageCount = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = sessions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  async function onJoin(s: TrainingSession): Promise<void> {
    setJoining(s.id)
    try {
      const link = await getSessionJoinLink(s.id)
      const url = link?.meet_url || link?.zoom_join_url
      if (!url) {
        toast.error("The meeting link is not available yet.")
        return
      }
      // Mark attendance on join. Outside the check-in window this throws, which
      // is fine: the learner still joins.
      await selfCheckIn(s.id).catch(() => undefined)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not join the session.")
    } finally {
      setJoining(null)
    }
  }

  function setTabReset(next: "active" | "archive"): void {
    setTab(next)
    setPage(1)
  }

  const titleById = new Map((data ?? []).map((s) => [s.id, s.title]))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Virtual training</h1>
          <p className="mt-1 text-muted-foreground">
            {canManage
              ? "Online sessions with Google Meet links and Zoom backup."
              : "Request a place, and join once an admin approves you."}
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link to="/platform/sessions/new">
              <Plus className="mr-2 size-4" /> New session
            </Link>
          </Button>
        )}
      </div>

      {/* Admin: pending join approvals */}
      {canApprove && (pending.data?.length ?? 0) > 0 && (
        <Card className="border-brand-gold/40 bg-brand-gold/[0.05]">
          <CardContent className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
              <ShieldCheck className="size-4 text-brand-gold" />
              Pending join requests ({pending.data?.length})
            </p>
            <ul className="mt-3 space-y-2">
              {pending.data?.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-2.5"
                >
                  <span className="min-w-0 text-sm">
                    <span className="font-medium text-foreground">{r.learnerName}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {titleById.get(r.sessionId) ?? "Session"}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      disabled={decide.isPending}
                      onClick={() =>
                        decide.mutate(
                          { id: r.id, learnerId: r.learnerId, approve: true },
                          { onError: (e) => toast.error(e instanceof Error ? e.message : "Failed") },
                        )
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decide.isPending}
                      onClick={() =>
                        decide.mutate(
                          { id: r.id, learnerId: r.learnerId, approve: false },
                          { onError: (e) => toast.error(e instanceof Error ? e.message : "Failed") },
                        )
                      }
                    >
                      Decline
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Staff tabs: live/upcoming vs archive */}
      {canManage && (
        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setTabReset("active")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "active" ? "bg-white text-brand-navy shadow-sm" : "text-muted-foreground"
            }`}
          >
            <CalendarClock className="size-4" /> Live and upcoming
          </button>
          <button
            type="button"
            onClick={() => setTabReset("archive")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "archive" ? "bg-white text-brand-navy shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Archive className="size-4" /> Archive
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load virtual sessions. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Video className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              {tab === "archive"
                ? "No past sessions yet."
                : canManage
                  ? "No live or upcoming sessions. Create one and mark it virtual."
                  : "No live or upcoming sessions right now. Check back soon."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((s) => {
              const phase = phaseOf(s, now)
              const status: JoinStatus | undefined = myRequests.data?.[s.id]
              return (
                <Card key={s.id} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-sans text-base font-semibold leading-snug text-foreground">
                        {canManage ? (
                          <Link to={`/platform/sessions/${s.id}`} className="hover:text-brand-navy">
                            {s.title}
                          </Link>
                        ) : (
                          s.title
                        )}
                      </h3>
                      <Badge
                        variant={phase === "live" ? "default" : phase === "past" ? "secondary" : "outline"}
                        className={phase === "live" ? "bg-success text-white" : ""}
                      >
                        {phase === "live" ? "Live now" : phase === "past" ? "Past" : "Upcoming"}
                      </Badge>
                    </div>

                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4" />
                      {format(new Date(s.starts_at), "EEE d MMM, HH:mm")} to{" "}
                      {format(new Date(s.ends_at), "HH:mm")}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-2 pt-1">
                      {/* Staff: manage + recording */}
                      {canManage ? (
                        <>
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/platform/sessions/${s.id}`}>Manage</Link>
                          </Button>
                          {s.recording_url && (
                            <Button asChild size="sm" variant="outline">
                              <a href={s.recording_url} target="_blank" rel="noopener noreferrer">
                                <PlayCircle className="mr-1.5 size-4" /> Recording
                              </a>
                            </Button>
                          )}
                        </>
                      ) : status === "approved" ? (
                        <Button size="sm" onClick={() => onJoin(s)} disabled={joining === s.id}>
                          {joining === s.id ? (
                            <Loader2 className="mr-1.5 size-4 animate-spin" />
                          ) : (
                            <Video className="mr-1.5 size-4" />
                          )}
                          Join
                        </Button>
                      ) : status === "pending" ? (
                        <Button size="sm" variant="outline" disabled>
                          <Hourglass className="mr-1.5 size-4" /> Awaiting approval
                        </Button>
                      ) : status === "declined" ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          Request not approved
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            requestJoin.mutate(s.id, {
                              onSuccess: () => toast.success("Request sent. An admin will review it."),
                              onError: (e) =>
                                toast.error(e instanceof Error ? e.message : "Could not send request"),
                            })
                          }
                          disabled={requestJoin.isPending}
                        >
                          <CheckCircle2 className="mr-1.5 size-4" /> Request to join
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Pagination
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
            label="Virtual sessions pagination"
            className="mt-8"
          />
        </>
      )}
    </div>
  )
}
