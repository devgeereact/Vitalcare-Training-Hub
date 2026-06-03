import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type {
  TrainingSession,
  AttendanceStatus,
  SessionStatus,
} from "@/types/database.types"
import type { SessionFormValues } from "@/lib/validations/session.schema"

export const sessionsKeys = {
  all: ["sessions"] as const,
  list: () => [...sessionsKeys.all, "list"] as const,
  detail: (id: string) => [...sessionsKeys.all, "detail", id] as const,
  bookings: (id: string) => [...sessionsKeys.all, "bookings", id] as const,
  attendance: (id: string) => [...sessionsKeys.all, "attendance", id] as const,
  calendar: () => [...sessionsKeys.all, "calendar"] as const,
  log: () => [...sessionsKeys.all, "log"] as const,
  timetable: () => [...sessionsKeys.all, "timetable"] as const,
}

// ─── Trainers (for the trainer select) ───────────────────────────────────────
export interface TrainerOption {
  id: string
  name: string
}
export async function getTrainers(): Promise<TrainerOption[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name")
    .in("role", ["trainer", "admin", "super_admin"])
    .is("deleted_at", null)
  if (error) {
    console.error("[getTrainers]", error)
    throw error
  }
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || p.id,
  }))
}
export function useTrainers() {
  return useQuery({ queryKey: ["trainer-options"], queryFn: getTrainers, staleTime: 10 * 60 * 1000 })
}

// ─── Sessions list ───────────────────────────────────────────────────────────
export interface SessionRow {
  id: string
  title: string
  startsAt: string
  endsAt: string
  venue: string
  isVirtual: boolean
  status: SessionStatus
  capacity: number | null
}

export async function getSessions(): Promise<SessionRow[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, title, starts_at, ends_at, venue, is_virtual, status, capacity")
    .is("deleted_at", null)
    .order("starts_at", { ascending: false })
  if (error) {
    console.error("[getSessions]", error)
    throw error
  }
  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    startsAt: s.starts_at,
    endsAt: s.ends_at,
    venue: s.venue ?? "",
    isVirtual: s.is_virtual,
    status: s.status,
    capacity: s.capacity,
  }))
}
export function useSessions() {
  return useQuery({ queryKey: sessionsKeys.list(), queryFn: getSessions })
}

// Booked-learner counts for a set of sessions, keyed by session id.
async function getBookedCounts(sessionIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (sessionIds.length === 0) return counts
  const { data, error } = await supabase
    .from("session_bookings")
    .select("session_id")
    .in("session_id", sessionIds)
    .is("deleted_at", null)
  if (error) {
    console.error("[getBookedCounts]", error)
    return counts
  }
  for (const b of data ?? []) {
    counts.set(b.session_id, (counts.get(b.session_id) ?? 0) + 1)
  }
  return counts
}

// ─── Timetable (weekly grid for one trainer) ─────────────────────────────────
export interface TimetableEntry {
  id: string
  title: string
  courseTitle: string | null
  venue: string
  isVirtual: boolean
  startsAt: string
  endsAt: string
  /** 0 = Monday … 6 = Sunday */
  weekday: number
  trainerName: string | null
  capacity: number | null
  booked: number
  meetUrl: string | null
  zoomUrl: string | null
  description: string | null
  status: SessionStatus
}

export async function getTimetable(
  trainerId: string,
  fromISO: string,
  toISO: string,
): Promise<TimetableEntry[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select(
      "id, title, course_id, trainer_id, venue, is_virtual, starts_at, ends_at, capacity, meet_url, zoom_join_url, description, status",
    )
    .eq("trainer_id", trainerId)
    .is("deleted_at", null)
    .gte("starts_at", fromISO)
    .lte("starts_at", toISO)
    .order("starts_at", { ascending: true })
  if (error) {
    console.error("[getTimetable]", error)
    throw error
  }
  if (!data || data.length === 0) return []

  const courseIds = [...new Set(data.map((d) => d.course_id).filter(Boolean))] as string[]
  const trainerIds = [...new Set(data.map((d) => d.trainer_id).filter(Boolean))] as string[]
  const [{ data: courses }, { data: trainerProfiles }, bookedCounts] = await Promise.all([
    courseIds.length
      ? supabase.from("courses").select("id, title").in("id", courseIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    trainerIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, first_name, last_name")
          .in("id", trainerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; first_name: string | null; last_name: string | null }[] }),
    getBookedCounts(data.map((d) => d.id)),
  ])
  const courseTitleById = new Map((courses ?? []).map((c) => [c.id, c.title]))
  const trainerNameById = new Map(
    (trainerProfiles ?? []).map((p) => [
      p.id,
      p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || null,
    ]),
  )

  return data.map((s) => {
    const d = new Date(s.starts_at)
    // JS getDay: 0=Sun..6=Sat → remap to 0=Mon..6=Sun
    const weekday = (d.getDay() + 6) % 7
    return {
      id: s.id,
      title: s.title,
      courseTitle: s.course_id ? courseTitleById.get(s.course_id) ?? null : null,
      venue: s.venue ?? "",
      isVirtual: s.is_virtual,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      weekday,
      trainerName: s.trainer_id ? trainerNameById.get(s.trainer_id) ?? null : null,
      capacity: s.capacity,
      booked: bookedCounts.get(s.id) ?? 0,
      meetUrl: s.meet_url ?? null,
      zoomUrl: s.zoom_join_url ?? null,
      description: s.description ?? null,
      status: s.status,
    }
  })
}

export function useTimetable(trainerId: string, fromISO: string, toISO: string) {
  return useQuery({
    queryKey: [...sessionsKeys.timetable(), trainerId, fromISO],
    queryFn: () => getTimetable(trainerId, fromISO, toISO),
    enabled: !!trainerId,
  })
}

export function useCalendarSessions() {
  return useQuery({ queryKey: sessionsKeys.calendar(), queryFn: getSessions })
}

// ─── Single session ──────────────────────────────────────────────────────────
export async function getSession(id: string): Promise<TrainingSession> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("id", id)
    .single()
  if (error) {
    console.error("[getSession]", error)
    throw error
  }
  return data as TrainingSession
}
export function useSession(id: string) {
  return useQuery({
    queryKey: sessionsKeys.detail(id),
    queryFn: () => getSession(id),
    enabled: !!id,
  })
}

function toRow(v: SessionFormValues) {
  return {
    title: v.title,
    description: v.description || null,
    course_id: v.course_id || null,
    trainer_id: v.trainer_id || null,
    starts_at: new Date(v.starts_at).toISOString(),
    ends_at: new Date(v.ends_at).toISOString(),
    venue: v.venue || null,
    capacity: v.capacity || null,
    is_virtual: v.is_virtual,
    is_public: v.is_public,
  }
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: SessionFormValues): Promise<string> => {
      const { data, error } = await supabase
        .from("training_sessions")
        .insert(toRow(v))
        .select("id")
        .single()
      if (error) {
        console.error("[useCreateSession]", error)
        throw error
      }

      const start = new Date(v.starts_at)
      const end = new Date(v.ends_at)
      const patch: Partial<TrainingSession> = {}
      const provider = v.meeting_provider ?? "google_meet"
      const wantMeet = v.is_virtual && provider === "google_meet"
      const duration = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / 60000),
      )

      const createZoom = async () => {
        try {
          const { data: zoom, error: zErr } = await supabase.functions.invoke(
            "zoom-create-meeting",
            { body: { topic: v.title, start_time: start.toISOString(), duration } },
          )
          if (!zErr && zoom?.join_url) {
            patch.zoom_meeting_id = zoom.id
            patch.zoom_join_url = zoom.join_url
            if (zoom.start_url) patch.zoom_start_url = zoom.start_url
            return true
          }
        } catch (zoomErr) {
          console.error("[useCreateSession:zoom]", zoomErr)
        }
        return false
      }

      // Zoom chosen explicitly: create it first as the primary link.
      let haveLink = false
      if (v.is_virtual && provider === "zoom") {
        haveLink = await createZoom()
      }

      // Google Calendar event always (keeps the calendar in sync), with a Meet
      // link only when Google Meet is the chosen provider.
      try {
        const { data: g, error: gErr } = await supabase.functions.invoke(
          "gmeet-create-event",
          {
            body: {
              title: v.title,
              description: v.description || "",
              start: start.toISOString(),
              end: end.toISOString(),
              location:
                v.venue ||
                (v.is_virtual
                  ? provider === "zoom"
                    ? "Online (Zoom)"
                    : "Online (Google Meet)"
                  : ""),
              withMeet: wantMeet,
            },
          },
        )
        if (!gErr && g?.eventId) {
          patch.gcal_event_id = g.eventId
          if (g.meetUrl) {
            patch.meet_url = g.meetUrl
            haveLink = true
          }
        }
      } catch (gErr) {
        console.error("[useCreateSession:gmeet]", gErr)
      }

      // Backup: if a virtual session still has no link, fall back to Zoom.
      if (v.is_virtual && !haveLink) {
        haveLink = await createZoom()
      }

      // Last resort: a virtual session should always have a join link. If both
      // Google Meet and Zoom were unavailable, use a deterministic Jitsi room
      // so the session can still go ahead. Real Meet links are preferred above.
      if (v.is_virtual && !haveLink && !patch.meet_url) {
        patch.meet_url = `https://meet.jit.si/vitalcare-session-${data.id}`
      }

      if (Object.keys(patch).length > 0) {
        await supabase.from("training_sessions").update(patch).eq("id", data.id)
      }
      return data.id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionsKeys.list() })
      qc.invalidateQueries({ queryKey: sessionsKeys.calendar() })
      qc.invalidateQueries({ queryKey: sessionsKeys.timetable() })
    },
  })
}

export function useSetSessionRecording(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase
        .from("training_sessions")
        .update({ recording_url: url.trim() || null })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionsKeys.detail(id) }),
  })
}

// Upload a recording file to Google Drive (via the drive-upload Edge Function)
// and store the returned public URL on the session. Falls back with a clear
// error if Drive is not connected, so staff can paste a link instead.
export function useUploadRecordingToDrive(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const form = new FormData()
      form.append("file", file)
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean
        url?: string
        notConfigured?: boolean
        error?: string
      }>("drive-upload", { body: form })
      if (error) {
        console.error("[useUploadRecordingToDrive]", error)
        throw error
      }
      if (data?.notConfigured) {
        throw new Error("Google Drive is not connected. Paste a link instead.")
      }
      if (!data?.url) {
        throw new Error(data?.error || "Drive upload failed")
      }
      const { error: upErr } = await supabase
        .from("training_sessions")
        .update({ recording_url: data.url })
        .eq("id", id)
      if (upErr) {
        console.error("[useUploadRecordingToDrive:save]", upErr)
        throw upErr
      }
      return data.url
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionsKeys.detail(id) }),
  })
}

export function useUpdateSession(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: SessionFormValues) => {
      const { error } = await supabase.from("training_sessions").update(toRow(v)).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionsKeys.detail(id) })
      qc.invalidateQueries({ queryKey: sessionsKeys.list() })
      qc.invalidateQueries({ queryKey: sessionsKeys.calendar() })
      qc.invalidateQueries({ queryKey: sessionsKeys.timetable() })
    },
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_sessions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionsKeys.list() })
      qc.invalidateQueries({ queryKey: sessionsKeys.calendar() })
      qc.invalidateQueries({ queryKey: sessionsKeys.timetable() })
    },
  })
}

// ─── Roster: bookings + attendance combined ──────────────────────────────────
export interface RosterRow {
  learnerId: string
  name: string
  bookingStatus: string
  attendance: AttendanceStatus | null
}

export async function getRoster(sessionId: string): Promise<RosterRow[]> {
  const [bookings, attendance] = await Promise.all([
    supabase
      .from("session_bookings")
      .select("learner_id, status")
      .eq("session_id", sessionId)
      .is("deleted_at", null),
    supabase
      .from("attendance_records")
      .select("learner_id, status")
      .eq("session_id", sessionId),
  ])
  if (bookings.error) {
    console.error("[getRoster]", bookings.error)
    throw bookings.error
  }
  const rows = bookings.data ?? []
  if (rows.length === 0) return []

  const learnerIds = rows.map((b) => b.learner_id)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name")
    .in("id", learnerIds)
  const nameById = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
    ]),
  )
  const attById = new Map((attendance.data ?? []).map((a) => [a.learner_id, a.status]))

  return rows.map((b) => ({
    learnerId: b.learner_id,
    name: nameById.get(b.learner_id) ?? "Unknown",
    bookingStatus: b.status,
    attendance: (attById.get(b.learner_id) as AttendanceStatus) ?? null,
  }))
}
export function useRoster(sessionId: string) {
  return useQuery({
    queryKey: sessionsKeys.bookings(sessionId),
    queryFn: () => getRoster(sessionId),
    enabled: !!sessionId,
  })
}

export function useRosterMutations(sessionId: string) {
  const qc = useQueryClient()
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: sessionsKeys.bookings(sessionId) })

  const addBooking = useMutation({
    mutationFn: async (learnerId: string) => {
      const { error } = await supabase
        .from("session_bookings")
        .insert({ session_id: sessionId, learner_id: learnerId })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const removeBooking = useMutation({
    mutationFn: async (learnerId: string) => {
      const { error } = await supabase
        .from("session_bookings")
        .delete()
        .eq("session_id", sessionId)
        .eq("learner_id", learnerId)
      if (error) throw error
      await supabase
        .from("attendance_records")
        .delete()
        .eq("session_id", sessionId)
        .eq("learner_id", learnerId)
    },
    onSuccess: invalidate,
  })

  const markAttendance = useMutation({
    mutationFn: async ({
      learnerId,
      status,
    }: {
      learnerId: string
      status: AttendanceStatus
    }) => {
      const { data: auth } = await supabase.auth.getUser()
      const { error } = await supabase.from("attendance_records").upsert(
        {
          session_id: sessionId,
          learner_id: learnerId,
          status,
          marked_by: auth.user?.id ?? null,
          marked_at: new Date().toISOString(),
        },
        { onConflict: "session_id,learner_id" },
      )
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: sessionsKeys.log() })
    },
  })

  return { addBooking, removeBooking, markAttendance }
}

// Learner self check-in (QR): set own booking -> attended (RLS allows own).
export async function selfCheckIn(sessionId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error("Not signed in")
  const { error } = await supabase
    .from("session_bookings")
    .upsert(
      { session_id: sessionId, learner_id: auth.user.id, status: "attended" },
      { onConflict: "session_id,learner_id" },
    )
  if (error) {
    console.error("[selfCheckIn]", error)
    throw error
  }
}

// ─── Attendance log ──────────────────────────────────────────────────────────
export interface AttendanceLogRow {
  id: string
  learnerName: string
  sessionTitle: string
  status: AttendanceStatus
  markedAt: string | null
}

export async function getAttendanceLog(): Promise<AttendanceLogRow[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, session_id, learner_id, status, marked_at")
    .order("marked_at", { ascending: false })
    .limit(500)
  if (error) {
    console.error("[getAttendanceLog]", error)
    throw error
  }
  if (!data || data.length === 0) return []

  const learnerIds = [...new Set(data.map((d) => d.learner_id))]
  const sessionIds = [...new Set(data.map((d) => d.session_id))]
  const [profiles, sessions] = await Promise.all([
    supabase.from("profiles").select("id, full_name, first_name, last_name").in("id", learnerIds),
    supabase.from("training_sessions").select("id, title").in("id", sessionIds),
  ])
  const nameById = new Map(
    (profiles.data ?? []).map((p) => [
      p.id,
      p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
    ]),
  )
  const titleById = new Map((sessions.data ?? []).map((s) => [s.id, s.title]))

  return data.map((d) => ({
    id: d.id,
    learnerName: nameById.get(d.learner_id) ?? "Unknown",
    sessionTitle: titleById.get(d.session_id) ?? "-",
    status: d.status,
    markedAt: d.marked_at,
  }))
}
export function useAttendanceLog() {
  return useQuery({ queryKey: sessionsKeys.log(), queryFn: getAttendanceLog })
}
