import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { FeedbackResponse } from "@/types/database.types"

export type FeedbackSource = "website" | "course" | "recommendation"
export type FeedbackStatus = "pending" | "approved" | "rejected"

/** Feedback row including the 039 source/approval columns (not yet in the
 *  generated Database type). */
export interface FeedbackRow extends FeedbackResponse {
  source: FeedbackSource
  status: FeedbackStatus
  author_name: string | null
  approved_at: string | null
  approved_by: string | null
}

/* feedback_responses gains columns in migration 039 that the generated type
 * does not know about; reach writes through a small typed builder. */
interface FeedbackWrite extends PromiseLike<{ error: { message: string } | null }> {
  eq(column: keyof FeedbackRow, value: unknown): FeedbackWrite
}
interface FeedbackBuilder {
  insert(values: Partial<FeedbackRow>): PromiseLike<{ error: { message: string } | null }>
  update(values: Partial<FeedbackRow>): FeedbackWrite
}
function feedbackTable(): FeedbackBuilder {
  return supabase.from("feedback_responses") as unknown as FeedbackBuilder
}

export interface SubmitFeedbackInput {
  nps: number
  rating: number
  comment: string
  source: FeedbackSource
  authorName?: string
  courseId?: string
}

/** Submit feedback. Anyone may submit; it lands as pending until an admin
 *  approves it. learnerId is optional so website visitors can submit too. */
export function useSubmitFeedback(learnerId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SubmitFeedbackInput) => {
      const { error } = await feedbackTable().insert({
        learner_id: learnerId ?? null,
        nps: input.nps,
        rating: input.rating,
        comment: input.comment.trim() || null,
        course_id: input.courseId || null,
        source: input.source,
        author_name: input.authorName?.trim() || null,
        status: "pending",
      })
      if (error) {
        console.error("[useSubmitFeedback]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  })
}

export interface FeedbackSummary {
  total: number
  approved: number
  pending: number
  npsScore: number
  promoters: number
  passives: number
  detractors: number
  avgRating: number
  /** Approved feedback for the public/results wall. */
  published: FeedbackRow[]
  /** Pending feedback awaiting an admin decision. */
  awaiting: FeedbackRow[]
}

/** Results for the admin wall: KPIs over approved feedback, plus the pending
 *  queue. Staff RLS returns every row; the summary computes from approved. */
export function useFeedbackResults() {
  return useQuery({
    queryKey: ["feedback", "results"],
    queryFn: async (): Promise<FeedbackSummary> => {
      const { data, error } = await supabase
        .from("feedback_responses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000)
      if (error) {
        console.error("[useFeedbackResults]", error)
        throw error
      }
      const rows = (data ?? []) as unknown as FeedbackRow[]
      const approved = rows.filter((r) => r.status === "approved")
      const awaiting = rows.filter((r) => r.status === "pending")

      const withNps = approved.filter((r) => r.nps !== null)
      const promoters = withNps.filter((r) => (r.nps ?? 0) >= 9).length
      const detractors = withNps.filter((r) => (r.nps ?? 0) <= 6).length
      const passives = withNps.length - promoters - detractors
      const npsScore =
        withNps.length > 0
          ? Math.round(((promoters - detractors) / withNps.length) * 100)
          : 0
      const ratings = approved.filter((r) => r.rating !== null)
      const avgRating =
        ratings.length > 0
          ? Math.round(
              (ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / ratings.length) * 10,
            ) / 10
          : 0
      return {
        total: rows.length,
        approved: approved.length,
        pending: awaiting.length,
        npsScore,
        promoters,
        passives,
        detractors,
        avgRating,
        published: approved,
        awaiting,
      }
    },
  })
}

/** Approve or reject a pending feedback submission (staff only via RLS). */
export function useModerateFeedback(adminId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; decision: "approved" | "rejected" }) => {
      const { error } = await feedbackTable()
        .update({
          status: input.decision,
          approved_at: input.decision === "approved" ? new Date().toISOString() : null,
          approved_by: adminId ?? null,
        })
        .eq("id", input.id)
      if (error) {
        console.error("[useModerateFeedback]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  })
}
