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

      // Primary: Google Calendar event + Meet link (virtual) via OAuth.
      let haveMeetLink = false
      try {
        const { data: g, error: gErr } = await supabase.functions.invoke(
          "gmeet-create-event",
          {
            body: {
              title: v.title,
              description: v.description || "",
              start: start.toISOString(),
              end: end.toISOString(),
              location: v.venue || (v.is_virtual ? "Online (Google Meet)" : ""),
              withMeet: v.is_virtual,
            },
          },
        )
        if (!gErr && g?.eventId) {
          patch.gcal_event_id = g.eventId
          if (g.meetUrl) {
            patch.meet_url = g.meetUrl
            haveMeetLink = true
          }
        }
      } catch (gErr) {
        console.error("[useCreateSession:gmeet]", gErr)
      }

      // Backup: Zoom for virtual sessions when no Meet link was created.
      if (v.is_virtual && !haveMeetLink) {
        try {
          const duration = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000))
          const { data: zoom, error: zErr } = await supabase.functions.invoke(
            "zoom-create-meeting",
            { body: { topic: v.title, start_time: start.toISOString(), duration } },
          )
          if (!zErr && zoom?.join_url) {
            patch.zoom_meeting_id = zoom.id
            patch.zoom_join_url = zoom.join_url
          }
        } catch (zoomErr) {
          console.error("[useCreateSession:zoom]", zoomErr)
        }
      }

      if (Object.keys(patch).length > 0) {
        await supabase.from("training_sessions").update(patch).eq("id", data.id)
      }
      return data.id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionsKeys.list() })
      qc.invalidateQueries({ queryKey: sessionsKeys.calendar() })
    },
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
    sessionTitle: titleById.get(d.session_id) ?? "—",
    status: d.status,
    markedAt: d.marked_at,
  }))
}
export function useAttendanceLog() {
  return useQuery({ queryKey: sessionsKeys.log(), queryFn: getAttendanceLog })
}
