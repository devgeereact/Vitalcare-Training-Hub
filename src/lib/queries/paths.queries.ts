import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { LearningPath } from "@/types/database.types"

export const pathKeys = {
  all: ["paths"] as const,
  list: () => [...pathKeys.all, "list"] as const,
  detail: (id: string) => [...pathKeys.all, "detail", id] as const,
  courses: (id: string, learnerId?: string) =>
    [...pathKeys.all, "courses", id, learnerId ?? "none"] as const,
}

export interface PathRow extends LearningPath {
  courseCount: number
}

export function usePaths() {
  return useQuery({
    queryKey: pathKeys.list(),
    queryFn: async (): Promise<PathRow[]> => {
      const { data, error } = await supabase
        .from("learning_paths")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error) {
        console.error("[usePaths]", error)
        throw error
      }
      const rows = (data ?? []) as LearningPath[]
      if (!rows.length) return []
      const { data: links } = await supabase
        .from("learning_path_courses")
        .select("path_id")
        .in(
          "path_id",
          rows.map((r) => r.id),
        )
      const counts = new Map<string, number>()
      for (const l of links ?? [])
        counts.set(l.path_id, (counts.get(l.path_id) ?? 0) + 1)
      return rows.map((r) => ({ ...r, courseCount: counts.get(r.id) ?? 0 }))
    },
  })
}

export function usePath(id: string) {
  return useQuery({
    queryKey: pathKeys.detail(id),
    enabled: !!id,
    queryFn: async (): Promise<LearningPath> => {
      const { data, error } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("id", id)
        .single()
      if (error) {
        console.error("[usePath]", error)
        throw error
      }
      return data as LearningPath
    },
  })
}

export interface PathCourseRow {
  linkId: string
  courseId: string
  title: string
  position: number
  enrolled: boolean
  completed: boolean
}

export function usePathCourses(pathId: string, learnerId?: string) {
  return useQuery({
    queryKey: pathKeys.courses(pathId, learnerId),
    enabled: !!pathId,
    queryFn: async (): Promise<PathCourseRow[]> => {
      const { data, error } = await supabase
        .from("learning_path_courses")
        .select("id, course_id, position")
        .eq("path_id", pathId)
        .order("position", { ascending: true })
      if (error) {
        console.error("[usePathCourses]", error)
        throw error
      }
      const rows = data ?? []
      if (!rows.length) return []
      const courseIds = rows.map((r) => r.course_id)
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", courseIds)
      const titleById = new Map((courses ?? []).map((c) => [c.id, c.title]))

      const enrolled = new Set<string>()
      const completed = new Set<string>()
      if (learnerId) {
        const { data: enrolments } = await supabase
          .from("enrollments")
          .select("course_id, status")
          .eq("learner_id", learnerId)
          .in("course_id", courseIds)
          .is("deleted_at", null)
        for (const e of enrolments ?? []) {
          enrolled.add(e.course_id)
          if (e.status === "completed") completed.add(e.course_id)
        }
      }
      return rows.map((r) => ({
        linkId: r.id,
        courseId: r.course_id,
        title: titleById.get(r.course_id) ?? "Course",
        position: r.position,
        enrolled: enrolled.has(r.course_id),
        completed: completed.has(r.course_id),
      }))
    },
  })
}

export function useCreatePath() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      description: string
      createdBy: string
    }) => {
      const { data, error } = await supabase
        .from("learning_paths")
        .insert({
          name: input.name.trim(),
          description: input.description.trim() || null,
          created_by: input.createdBy,
          is_published: true,
        })
        .select("id")
        .single()
      if (error) {
        console.error("[useCreatePath]", error)
        throw error
      }
      return data.id as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: pathKeys.list() }),
  })
}

export function usePathCourseMutations(pathId: string) {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: pathKeys.courses(pathId) })
    qc.invalidateQueries({ queryKey: pathKeys.list() })
  }
  const add = useMutation({
    mutationFn: async (input: { courseId: string; position: number }) => {
      const { error } = await supabase
        .from("learning_path_courses")
        .insert({ path_id: pathId, course_id: input.courseId, position: input.position })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("learning_path_courses")
        .delete()
        .eq("id", linkId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
  return { add, remove }
}

export interface EnrolPathResult {
  enrolled: number
  skipped: number
}

/** Enrol the learner on every course in the path, skipping existing. */
export function useEnrolPath(pathId: string, learnerId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<EnrolPathResult> => {
      const { data: links } = await supabase
        .from("learning_path_courses")
        .select("course_id")
        .eq("path_id", pathId)
      const courseIds = (links ?? []).map((l) => l.course_id)
      if (!courseIds.length || !learnerId) return { enrolled: 0, skipped: 0 }

      const { data: existing } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("learner_id", learnerId)
        .in("course_id", courseIds)
        .is("deleted_at", null)
      const already = new Set((existing ?? []).map((e) => e.course_id))
      const toEnrol = courseIds.filter((c) => !already.has(c))
      if (toEnrol.length) {
        const { error } = await supabase.from("enrollments").insert(
          toEnrol.map((course_id) => ({
            learner_id: learnerId,
            course_id,
            status: "not_started" as const,
          })),
        )
        if (error) {
          console.error("[useEnrolPath]", error)
          throw error
        }
      }
      return { enrolled: toEnrol.length, skipped: already.size }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: pathKeys.courses(pathId) }),
  })
}
