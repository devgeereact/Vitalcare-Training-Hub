import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { FeedbackResponse } from "@/types/database.types"

export function useSubmitFeedback(learnerId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      nps: number
      rating: number
      comment: string
      courseId?: string
    }) => {
      const { error } = await supabase.from("feedback_responses").insert({
        learner_id: learnerId,
        nps: input.nps,
        rating: input.rating,
        comment: input.comment.trim() || null,
        course_id: input.courseId || null,
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
  npsScore: number
  promoters: number
  passives: number
  detractors: number
  avgRating: number
  recent: FeedbackResponse[]
}

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
      const rows = (data ?? []) as FeedbackResponse[]
      const withNps = rows.filter((r) => r.nps !== null)
      const promoters = withNps.filter((r) => (r.nps ?? 0) >= 9).length
      const detractors = withNps.filter((r) => (r.nps ?? 0) <= 6).length
      const passives = withNps.length - promoters - detractors
      const npsScore =
        withNps.length > 0
          ? Math.round(((promoters - detractors) / withNps.length) * 100)
          : 0
      const ratings = rows.filter((r) => r.rating !== null)
      const avgRating =
        ratings.length > 0
          ? Math.round(
              (ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / ratings.length) * 10,
            ) / 10
          : 0
      return {
        total: rows.length,
        npsScore,
        promoters,
        passives,
        detractors,
        avgRating,
        recent: rows.slice(0, 20),
      }
    },
  })
}
