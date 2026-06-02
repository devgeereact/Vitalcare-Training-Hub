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

export function useMarkSelfAttendance(learnerId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["my-sessions", learnerId ?? "none"] }),
  })
}
