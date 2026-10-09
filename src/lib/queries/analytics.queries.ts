import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { startOfYearUtc } from "@/lib/dates"

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

/**
 * Year-to-date business measures, with the filters their names imply.
 *
 * `useAnalyticsSummary` counts what exists: every learner account, every
 * training session, every certificate. Those are the right numbers for an
 * operational dashboard and the wrong ones for a report headed "Year to date",
 * which is how the Business Overview workbook came to describe registered
 * accounts as "Learners Trained" and scheduled sessions as "Courses
 * Delivered", including sessions that had been cancelled or had not happened
 * yet.
 *
 * Each figure here is dated, and each one says what it counts:
 *
 * - `learnersTrained` counts people who completed a course this year, once
 *   each, not people who hold an account.
 * - `sessionsDelivered` counts sessions marked completed whose end time has
 *   passed. Cancelled and future sessions are excluded.
 * - `invoicedPence` is what was billed. `receivedPence` is what was actually
 *   paid. They are different numbers and the report keeps them apart.
 */
export interface BusinessMeasures {
  /** Inclusive start of the period, ISO. */
  periodStart: string
  /** The moment the figures were taken, ISO. */
  periodEnd: string
  learnersTrained: number
  completions: number
  sessionsDelivered: number
  sessionsScheduled: number
  sessionsCancelled: number
  certificatesIssued: number
  enrolments: number
  invoicedPence: number
  receivedPence: number
  orderReceiptsPence: number
}

export function useBusinessMeasures() {
  return useQuery({
    queryKey: ["analytics", "business-measures"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<BusinessMeasures> => {
      const now = new Date()
      const periodStart = startOfYearUtc(now).toISOString()
      const nowIso = now.toISOString()
      const head = { count: "exact" as const, head: true }

      const [
        completionRows,
        sessionsDelivered,
        sessionsScheduled,
        sessionsCancelled,
        certificates,
        enrolments,
        invoiceRows,
        orderRows,
      ] = await Promise.all([
        // Distinct learners, so somebody who finished three courses is one
        // person trained, not three.
        supabase
          .from("enrollments")
          .select("learner_id")
          .eq("status", "completed")
          .gte("completed_at", periodStart)
          .lte("completed_at", nowIso)
          .is("deleted_at", null)
          .limit(10_000),
        supabase
          .from("training_sessions")
          .select("*", head)
          .eq("status", "completed")
          .gte("ends_at", periodStart)
          .lte("ends_at", nowIso)
          .is("deleted_at", null),
        supabase
          .from("training_sessions")
          .select("*", head)
          .eq("status", "scheduled")
          .gt("starts_at", nowIso)
          .is("deleted_at", null),
        supabase
          .from("training_sessions")
          .select("*", head)
          .eq("status", "cancelled")
          .gte("starts_at", periodStart)
          .is("deleted_at", null),
        supabase
          .from("learner_certificates")
          .select("*", head)
          .eq("approved", true)
          .gte("issued_at", periodStart)
          .lte("issued_at", nowIso)
          .is("deleted_at", null),
        supabase
          .from("enrollments")
          .select("*", head)
          .gte("enrolled_at", periodStart)
          .lte("enrolled_at", nowIso)
          .is("deleted_at", null),
        // Raised in the period, or paid in it. An invoice raised in December
        // and paid in January belongs in this year's received figure and not
        // in its invoiced figure, so filtering on one date alone loses it.
        supabase
          .from("invoices")
          .select("total_pence, status, created_at, paid_at")
          .or(`created_at.gte.${periodStart},paid_at.gte.${periodStart}`)
          .limit(10_000),
        supabase
          .from("orders")
          .select("total_pence, status, paid_at")
          .eq("status", "paid")
          .gte("paid_at", periodStart)
          .limit(10_000),
      ])

      if (completionRows.error) {
        console.error("[businessMeasures:completions]", completionRows.error)
        throw completionRows.error
      }
      if (invoiceRows.error) {
        console.error("[businessMeasures:invoices]", invoiceRows.error)
        throw invoiceRows.error
      }
      if (orderRows.error) {
        console.error("[businessMeasures:orders]", orderRows.error)
        throw orderRows.error
      }

      const completions = completionRows.data ?? []
      const invoices = invoiceRows.data ?? []

      // A void or draft invoice is not money billed.
      const invoicedPence = invoices
        .filter(
          (i) =>
            (i.status === "sent" || i.status === "paid") &&
            i.created_at >= periodStart,
        )
        .reduce((sum, i) => sum + i.total_pence, 0)
      const receivedPence = invoices
        .filter((i) => i.status === "paid" && i.paid_at && i.paid_at >= periodStart)
        .reduce((sum, i) => sum + i.total_pence, 0)
      const orderReceiptsPence = (orderRows.data ?? []).reduce(
        (sum, o) => sum + o.total_pence,
        0,
      )

      return {
        periodStart,
        periodEnd: nowIso,
        learnersTrained: new Set(completions.map((c) => c.learner_id)).size,
        completions: completions.length,
        sessionsDelivered: asCount(sessionsDelivered),
        sessionsScheduled: asCount(sessionsScheduled),
        sessionsCancelled: asCount(sessionsCancelled),
        certificatesIssued: asCount(certificates),
        enrolments: asCount(enrolments),
        invoicedPence,
        receivedPence,
        orderReceiptsPence,
      }
    },
  })
}
