import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

export interface AnalyticsSummary {
  learners: number
  courses: number
  publishedCourses: number
  enrolments: number
  completions: number
  completionRate: number
  certificates: number
  sessions: number
  upcomingSessions: number
}

/**
 * Extract a row count from a Supabase head query result.
 *
 * Throws rather than returning 0. A failed count rendered as "0 learners" is a
 * statistic that is not merely missing but wrong, and it is wrong in the
 * direction that looks like a business problem rather than a defect.
 */
function asCount(res: { count: number | null; error: unknown }): number {
  if (res.error) {
    console.error("[analytics:count]", res.error)
    throw res.error
  }
  return res.count ?? 0
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<AnalyticsSummary> => {
      const nowIso = new Date().toISOString()
      const head = { count: "exact" as const, head: true }
      const results = await Promise.all([
        supabase
          .from("profiles")
          .select("*", head)
          .eq("role", "learner")
          .is("deleted_at", null),
        supabase.from("courses").select("*", head).is("deleted_at", null),
        supabase
          .from("courses")
          .select("*", head)
          .eq("is_published", true)
          .is("deleted_at", null),
        supabase.from("enrollments").select("*", head).is("deleted_at", null),
        supabase
          .from("enrollments")
          .select("*", head)
          .eq("status", "completed")
          .is("deleted_at", null),
        supabase
          .from("learner_certificates")
          .select("*", head)
          .is("deleted_at", null),
        supabase.from("training_sessions").select("*", head).is("deleted_at", null),
        supabase
          .from("training_sessions")
          .select("*", head)
          .gte("starts_at", nowIso)
          .is("deleted_at", null),
      ])
      const [
        learners,
        courses,
        publishedCourses,
        enrolments,
        completions,
        certificates,
        sessions,
        upcomingSessions,
      ] = results.map(asCount)
      const completionRate =
        enrolments > 0 ? Math.round((completions / enrolments) * 100) : 0
      return {
        learners,
        courses,
        publishedCourses,
        enrolments,
        completions,
        completionRate,
        certificates,
        sessions,
        upcomingSessions,
      }
    },
  })
}

export interface EnrolmentTrendPoint {
  month: string
  enrolments: number
}

/** Enrolments grouped by month for the last 6 months. */
export function useEnrolmentTrend() {
  return useQuery({
    queryKey: ["analytics", "enrolment-trend"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<EnrolmentTrendPoint[]> => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("enrolled_at")
        .is("deleted_at", null)
        .order("enrolled_at", { ascending: true })
        .limit(2000)
      if (error) {
        console.error("[useEnrolmentTrend]", error)
        throw error
      }
      const buckets = new Map<string, number>()
      for (const row of data ?? []) {
        const d = new Date(row.enrolled_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        buckets.set(key, (buckets.get(key) ?? 0) + 1)
      }
      return [...buckets.entries()]
        .slice(-6)
        .map(([month, enrolments]) => ({ month, enrolments }))
    },
  })
}
