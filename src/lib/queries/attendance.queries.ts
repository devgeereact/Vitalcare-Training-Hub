import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { AttendanceStatus, TrainingSession } from "@/types/database.types"

export interface MySession {
  sessionId: string
  title: string
  startsAt: string
  endsAt: string
  isVirtual: boolean
  meetUrl: string | null
  zoomUrl: string | null
  recordingUrl: string | null
  attendance: AttendanceStatus | null
}

export function useMyBookedSessions(learnerId: string | undefined) {
  return useQuery({
    queryKey: ["my-sessions", learnerId ?? "none"],
    enabled: !!learnerId,
    queryFn: async (): Promise<MySession[]> => {
      const { data: bookings, error } = await supabase
        .from("session_bookings")
        .select("session_id")
        .eq("learner_id", learnerId!)
      if (error) {
        console.error("[useMyBookedSessions]", error)
        throw error
      }
      const ids = (bookings ?? []).map((b) => b.session_id)
      if (!ids.length) return []

      const [{ data: sessions }, { data: att }] = await Promise.all([
        supabase
          .from("training_sessions")
          .select("*")
          .in("id", ids)
          .is("deleted_at", null)
          .order("starts_at", { ascending: true }),
        supabase
          .from("attendance_records")
          .select("session_id, status")
          .eq("learner_id", learnerId!)
          .in("session_id", ids),
      ])
      const statusBySession = new Map(
        (att ?? []).map((a) => [a.session_id, a.status as AttendanceStatus]),
      )
      return ((sessions ?? []) as TrainingSession[]).map((s) => ({
        sessionId: s.id,
        title: s.title,
        startsAt: s.starts_at,
        endsAt: s.ends_at,
        isVirtual: s.is_virtual,
        meetUrl: s.meet_url,
        zoomUrl: s.zoom_join_url,
        recordingUrl: s.recording_url,
        attendance: statusBySession.get(s.id) ?? null,
      }))
    },
  })
}

export interface MyAttendanceRecord {
  id: string
  sessionId: string
  sessionTitle: string
  sessionStartsAt: string | null
  status: AttendanceStatus
  markedAt: string | null
}

/**
 * A learner's own attendance register: every session they were marked for,
 * most recent first. Powers the register card on the learner dashboard.
 */
export function useMyAttendanceRegister(learnerId: string | undefined) {
  return useQuery({
    queryKey: ["my-attendance-register", learnerId ?? "none"],
    enabled: !!learnerId,
    queryFn: async (): Promise<MyAttendanceRecord[]> => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, session_id, status, marked_at")
        .eq("learner_id", learnerId!)
        .order("marked_at", { ascending: false })
        .limit(100)
      if (error) {
        console.error("[useMyAttendanceRegister]", error)
        throw error
      }
      if (!data || data.length === 0) return []

      const ids = [...new Set(data.map((d) => d.session_id))]
      const { data: sessions } = await supabase
        .from("training_sessions")
        .select("id, title, starts_at")
        .in("id", ids)
      const sessionById = new Map((sessions ?? []).map((s) => [s.id, s]))

      return data.map((d) => {
        const s = sessionById.get(d.session_id)
        return {
          id: d.id,
          sessionId: d.session_id,
          sessionTitle: s?.title ?? "Session",
          sessionStartsAt: s?.starts_at ?? null,
          status: d.status as AttendanceStatus,
          markedAt: d.marked_at,
        }
      })
    },
  })
}

export function useMarkSelfAttendance(learnerId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Only allow self check-in around the session time: from 30 minutes
      // before the start until 12 hours after the end. Stops marking present
      // on a session that has not started or finished long ago.
      const { data: s } = await supabase
        .from("training_sessions")
        .select("starts_at, ends_at")
        .eq("id", sessionId)
        .single()
      if (s) {
        const now = Date.now()
        const start = new Date(s.starts_at).getTime()
        const end = new Date(s.ends_at).getTime()
        if (Number.isFinite(start) && now < start - 30 * 60 * 1000) {
          throw new Error("This session has not started yet.")
        }
        if (Number.isFinite(end) && now > end + 12 * 60 * 60 * 1000) {
          throw new Error("This session has ended.")
        }
      }

      const { error } = await supabase.from("attendance_records").upsert(
        {
          session_id: sessionId,
          learner_id: learnerId!,
          status: "present",
          marked_by: learnerId!,
          marked_at: new Date().toISOString(),
        },
        { onConflict: "session_id,learner_id" },
      )
      if (error) {
        console.error("[useMarkSelfAttendance]", error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-sessions", learnerId ?? "none"] })
      qc.invalidateQueries({
        queryKey: ["my-attendance-register", learnerId ?? "none"],
      })
    },
  })
}
