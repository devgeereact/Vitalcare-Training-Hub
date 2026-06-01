import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { EnrollmentStatus } from "@/types/database.types"

export interface EnrolmentRow {
  id: string
  learnerName: string
  courseTitle: string
  status: EnrollmentStatus
  progressPct: number
  enrolledAt: string
}

export function useEnrolments() {
  return useQuery({
    queryKey: ["enrolments", "list"],
    queryFn: async (): Promise<EnrolmentRow[]> => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, learner_id, course_id, status, progress_pct, enrolled_at")
        .is("deleted_at", null)
        .order("enrolled_at", { ascending: false })
        .limit(500)
      if (error) {
        console.error("[useEnrolments]", error)
        throw error
      }
      const rows = data ?? []
      if (rows.length === 0) return []

      const learnerIds = [...new Set(rows.map((r) => r.learner_id))]
      const courseIds = [...new Set(rows.map((r) => r.course_id))]
      const [{ data: learners }, { data: courses }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", learnerIds),
        supabase.from("courses").select("id, title").in("id", courseIds),
      ])
      const nameById = new Map(
        (learners ?? []).map((p) => [
          p.id,
          p.full_name ||
            [p.first_name, p.last_name].filter(Boolean).join(" ") ||
            "Unnamed learner",
        ]),
      )
      const titleById = new Map((courses ?? []).map((c) => [c.id, c.title]))

      return rows.map((r) => ({
        id: r.id,
        learnerName: nameById.get(r.learner_id) ?? "Unnamed learner",
        courseTitle: titleById.get(r.course_id) ?? "Untitled course",
        status: r.status,
        progressPct: r.progress_pct,
        enrolledAt: r.enrolled_at,
      }))
    },
  })
}
