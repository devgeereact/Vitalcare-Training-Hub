import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { CourseFaq, CourseReview } from "@/types/database.types"

/* --------------------------------------------------------------- reviews -- */

export interface ReviewRow extends CourseReview {
  authorName: string
}
export interface ReviewSummary {
  average: number
  count: number
  reviews: ReviewRow[]
  mine: CourseReview | null
}

export function useReviews(courseId: string, learnerId?: string) {
  return useQuery({
    queryKey: ["course-reviews", courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<ReviewSummary> => {
      const { data, error } = await supabase
        .from("course_reviews")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })
      if (error) {
        console.error("[useReviews]", error)
        throw error
      }
      const rows = (data ?? []) as CourseReview[]
      const ids = [...new Set(rows.map((r) => r.learner_id))]
      const names = new Map<string, string>()
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", ids)
        for (const p of profiles ?? [])
          names.set(
            p.id,
            p.full_name ||
              [p.first_name, p.last_name].filter(Boolean).join(" ") ||
              "Learner",
          )
      }
      const average =
        rows.length > 0
          ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10
          : 0
      return {
        average,
        count: rows.length,
        reviews: rows.map((r) => ({ ...r, authorName: names.get(r.learner_id) ?? "Learner" })),
        mine: learnerId ? rows.find((r) => r.learner_id === learnerId) ?? null : null,
      }
    },
  })
}

export function useSubmitReview(courseId: string, learnerId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { rating: number; comment: string }) => {
      const { error } = await supabase
        .from("course_reviews")
        .upsert(
          {
            course_id: courseId,
            learner_id: learnerId!,
            rating: input.rating,
            comment: input.comment.trim() || null,
          },
          { onConflict: "course_id,learner_id" },
        )
      if (error) {
        console.error("[useSubmitReview]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["course-reviews", courseId] }),
  })
}

/* ------------------------------------------------------------------ FAQs -- */

export function useFaqs(courseId: string) {
  return useQuery({
    queryKey: ["course-faqs", courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<CourseFaq[]> => {
      const { data, error } = await supabase
        .from("course_faqs")
        .select("*")
        .eq("course_id", courseId)
        .order("position", { ascending: true })
      if (error) {
        console.error("[useFaqs]", error)
        throw error
      }
      return (data ?? []) as CourseFaq[]
    },
  })
}

export function useFaqMutations(courseId: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ["course-faqs", courseId] })
  const add = useMutation({
    mutationFn: async (input: { question: string; answer: string; position: number }) => {
      const { error } = await supabase.from("course_faqs").insert({
        course_id: courseId,
        question: input.question.trim(),
        answer: input.answer.trim(),
        position: input.position,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_faqs").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
  return { add, remove }
}

/* --------------------------------------------------------- prerequisites -- */

export interface PrereqRow {
  id: string
  prerequisiteId: string
  title: string
  completed: boolean
}

export function usePrerequisites(courseId: string, learnerId?: string) {
  return useQuery({
    queryKey: ["course-prereqs", courseId, learnerId ?? "none"],
    enabled: !!courseId,
    queryFn: async (): Promise<PrereqRow[]> => {
      const { data, error } = await supabase
        .from("course_prerequisites")
        .select("id, prerequisite_id")
        .eq("course_id", courseId)
      if (error) {
        console.error("[usePrerequisites]", error)
        throw error
      }
      const rows = data ?? []
      if (!rows.length) return []
      const prereqIds = rows.map((r) => r.prerequisite_id)
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", prereqIds)
      const titleById = new Map((courses ?? []).map((c) => [c.id, c.title]))

      let completed = new Set<string>()
      if (learnerId) {
        const { data: done } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("learner_id", learnerId)
          .eq("status", "completed")
          .in("course_id", prereqIds)
        completed = new Set((done ?? []).map((d) => d.course_id))
      }
      return rows.map((r) => ({
        id: r.id,
        prerequisiteId: r.prerequisite_id,
        title: titleById.get(r.prerequisite_id) ?? "Course",
        completed: completed.has(r.prerequisite_id),
      }))
    },
  })
}

export function usePrereqMutations(courseId: string) {
  const qc = useQueryClient()
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["course-prereqs", courseId] })
  const add = useMutation({
    mutationFn: async (prerequisiteId: string) => {
      const { error } = await supabase
        .from("course_prerequisites")
        .insert({ course_id: courseId, prerequisite_id: prerequisiteId })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_prerequisites").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
  return { add, remove }
}
