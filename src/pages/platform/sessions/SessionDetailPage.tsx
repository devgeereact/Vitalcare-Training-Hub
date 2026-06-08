import { useRef, useState, type ChangeEvent } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Video,
  MapPin,
  Clock,
  UserPlus,
  AlertCircle,
  Users,
  Radio,
  PlayCircle,
  Loader2,
  Upload,
  HardDrive,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase/client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  useSession,
  useRoster,
  useRosterMutations,
  useDeleteSession,
  useSetSessionRecording,
  useUploadRecordingToDrive,
} from "@/lib/queries/sessions.queries"
import { useLearners } from "@/lib/queries/learners.queries"
import { useUser } from "@/hooks/use-user"
import { sessionPhase, sessionPhaseLabel } from "@/lib/sessions/timing"
import { useVerifiedUserIds } from "@/lib/queries/verification.queries"
import { VerifiedTick } from "@/components/platform/Verification"
import type { AttendanceStatus } from "@/types/database.types"

const STATUSES: { key: AttendanceStatus; label: string; cls: string }[] = [
  { key: "present", label: "Present", cls: "bg-success/15 text-success" },
  { key: "late", label: "Late", cls: "bg-warning/15 text-warning" },
  { key: "excused", label: "Excused", cls: "bg-primary/10 text-primary" },
  { key: "absent", label: "Absent", cls: "bg-destructive/15 text-destructive" },
]

export default function SessionDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { isAdmin, isTrainer } = useUser()
  const canManage = isAdmin || isTrainer
  const session = useSession(id)
  const roster = useRoster(id)
  const verifiedIds = useVerifiedUserIds()
  const learners = useLearners()
  const mut = useRosterMutations(id)
  const del = useDeleteSession()
  const setRec = useSetSessionRecording(id)
  const driveUpload = useUploadRecordingToDrive(id)
  const recordingRef = useRef("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [addLearner, setAddLearner] = useState("")
  const [zoomSyncing, setZoomSyncing] = useState(false)

  function onPickRecordingFile(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    ev.target.value = "" // allow re-selecting the same file
    if (!file) return
    driveUpload
      .mutateAsync(file)
      .then(() => toast.success("Recording uploaded to Drive and linked"))
      .catch((err: unknown) =>
        toast.error(
          err instanceof Error && err.message
            ? err.message
            : "Could not upload to Drive",
        ),
      )
  }

  const bookedIds = new Set((roster.data ?? []).map((r) => r.learnerId))
  const available = (learners.data ?? []).filter((l) => !bookedIds.has(l.id))
  const checkInUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/platform/sessions/${id}/checkin`
      : ""

  if (session.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (session.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Could not load this session.</p>
        <Button variant="outline" size="sm" onClick={() => session.refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const s = session.data!
  recordingRef.current = recordingRef.current || s.recording_url || ""
  const phase = sessionPhase(s.starts_at, s.ends_at)
  const ended = phase === "ended"
  const phaseBadgeCls =
    phase === "live"
      ? "border-success bg-success/10 text-success"
      : phase === "ended"
        ? "border-border bg-muted text-muted-foreground"
        : "border-brand-gold bg-brand-gold/10 text-brand-navy"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/platform/sessions">
            <ArrowLeft className="mr-1.5 size-4" /> Back to sessions
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/platform/sessions/${id}/edit`}>
              <Pencil className="mr-1.5 size-4" /> Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() =>
              del
                .mutateAsync(id)
                .then(() => {
                  toast.success("Session deleted")
                  navigate("/platform/sessions")
                })
                .catch(() => toast.error("Could not delete"))
            }
          >
            <Trash2 className="mr-1.5 size-4" /> Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="font-display text-2xl">{s.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("gap-1", phaseBadgeCls)}>
                {phase === "live" && <Radio className="size-3.5" />}
                {sessionPhaseLabel(phase)}
              </Badge>
              <Badge variant="outline" className="gap-1">
                {s.is_virtual ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}
                {s.is_virtual ? "Virtual" : "In person"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {format(new Date(s.starts_at), "EEE d MMM yyyy, HH:mm")} –{" "}
            {format(new Date(s.ends_at), "HH:mm")}
          </p>
          {s.venue && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {s.venue}
            </p>
          )}
          {s.description && <p className="pt-1 text-sm">{s.description}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {ended ? (
              (s.meet_url || s.zoom_join_url) && (
                <Button size="sm" variant="outline" disabled>
                  <Video className="mr-1.5 size-4" /> Meeting ended
                </Button>
              )
            ) : canManage ? (
              // Staff get the meeting links directly to run the session.
              <>
                {s.meet_url && (
                  <Button asChild size="sm">
                    <a href={s.meet_url} target="_blank" rel="noopener noreferrer">
                      <Video className="mr-1.5 size-4" /> Join Google Meet
                    </a>
                  </Button>
                )}
                {s.zoom_join_url && (
                  <Button asChild size="sm" variant={s.meet_url ? "outline" : "default"}>
                    <a href={s.zoom_join_url} target="_blank" rel="noopener noreferrer">
                      <Video className="mr-1.5 size-4" /> Join Zoom meeting
                    </a>
                  </Button>
                )}
                {s.zoom_start_url && (
                  <Button asChild size="sm" variant="outline">
                    <a href={s.zoom_start_url} target="_blank" rel="noopener noreferrer">
                      <Radio className="mr-1.5 size-4" /> Launch as host
                    </a>
                  </Button>
                )}
              </>
            ) : (
              // Learners must request a place first; the Join button only appears
              // once an admin approves them, over on the Virtual training page.
              (s.meet_url || s.zoom_join_url) && (
                <Button asChild size="sm">
                  <Link to="/platform/virtual">
                    <Video className="mr-1.5 size-4" /> Request a place to join
                  </Link>
                </Button>
              )
            )}
            {s.recording_url && (
              <Button asChild size="sm" variant="outline">
                <a href={s.recording_url} target="_blank" rel="noopener noreferrer">
                  <PlayCircle className="mr-1.5 size-4" /> Watch recording
                </a>
              </Button>
            )}
          </div>

          {s.zoom_meeting_id && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={zoomSyncing}
                onClick={async () => {
                  setZoomSyncing(true)
                  try {
                    const { data, error } = await supabase.functions.invoke("zoom-sync-session", {
                      body: { sessionId: id },
                    })
                    if (error) throw error
                    toast.success("Synced from Zoom", {
                      description: `${data?.attendanceMarked ?? 0} attendees marked${data?.recording ? ", recording linked" : ""}.`,
                    })
                    session.refetch()
                    roster.refetch()
                  } catch {
                    toast.error("Zoom sync failed", {
                      description: "Needs report + recording scopes on your Zoom app.",
                    })
                  } finally {
                    setZoomSyncing(false)
                  }
                }}
              >
                {zoomSyncing ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Radio className="mr-1.5 size-4" />
                )}
                Sync attendance + recording from Zoom
              </Button>
            </div>
          )}

          {/* Recording: staff paste a link or upload straight to Google Drive
              so absentees can replay. */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-muted-foreground">Session recording</p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Recording link (Zoom/Drive/YouTube)…"
                defaultValue={s.recording_url ?? ""}
                onChange={(e) => (recordingRef.current = e.target.value)}
                className="max-w-xs"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={setRec.isPending}
                onClick={() =>
                  setRec
                    .mutateAsync(recordingRef.current)
                    .then(() => toast.success("Recording saved"))
                    .catch(() => toast.error("Could not save"))
                }
              >
                Save link
              </Button>
              <span className="text-xs text-muted-foreground">or</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*,.mp4,.mov,.m4a,.mp3,.webm"
                className="hidden"
                onChange={onPickRecordingFile}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={driveUpload.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {driveUpload.isPending ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <HardDrive className="mr-1.5 size-4" />
                )}
                Save to Google Drive
              </Button>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Upload className="size-3.5" />
              Uploading saves the file to the connected Drive folder and links it here. If
              Drive is not connected, paste a share link instead.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Attendance register */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance register</CardTitle>
            <CardDescription>Mark each learner for this session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={addLearner} onValueChange={setAddLearner}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Add a learner…" />
                </SelectTrigger>
                <SelectContent>
                  {available.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No more learners
                    </SelectItem>
                  ) : (
                    available.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                disabled={!addLearner || mut.addBooking.isPending}
                onClick={() =>
                  mut.addBooking
                    .mutateAsync(addLearner)
                    .then(() => {
                      toast.success("Learner added")
                      setAddLearner("")
                    })
                    .catch(() => toast.error("Could not add"))
                }
              >
                <UserPlus className="mr-1.5 size-4" /> Add
              </Button>
            </div>

            {roster.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (roster.data?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Users className="size-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No learners booked yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {roster.data!.map((r) => (
                  <li key={r.learnerId} className="flex flex-wrap items-center gap-2 py-2.5">
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium">
                      <span className="truncate">{r.name}</span>
                      <VerifiedTick verified={!!verifiedIds.data?.has(r.learnerId)} />
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {STATUSES.map((st) => (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() =>
                            mut.markAttendance
                              .mutateAsync({ learnerId: r.learnerId, status: st.key })
                              .catch(() => toast.error("Could not mark"))
                          }
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843]",
                            r.attendance === st.key
                              ? st.cls
                              : "bg-muted text-muted-foreground hover:bg-muted/70",
                          )}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* QR check-in */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>QR check-in</CardTitle>
            <CardDescription>Learners scan to mark themselves attended.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {checkInUrl && (
              <div className="rounded-lg bg-white p-3">
                <QRCodeSVG value={checkInUrl} size={180} fgColor="#1b2e6b" />
              </div>
            )}
            <p className="break-all text-center text-xs text-muted-foreground">{checkInUrl}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
