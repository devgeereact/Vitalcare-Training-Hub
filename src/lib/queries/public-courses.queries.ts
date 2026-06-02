import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { Course } from "@/types/database.types"
import {
  getCurriculum,
  type CurriculumModule,
} from "@/lib/queries/courses.queries"

/**
 * Anon-safe fetchers for the public marketing site. These read only published
 * courses, relying on the courses table RLS allowing public read of published
 * rows.
 */

export const publicCoursesKeys = {
  all: ["public-courses"] as const,
  detail: (slug: string) => [...publicCoursesKeys.all, "detail", slug] as const,
  curriculum: (id: string) =>
    [...publicCoursesKeys.all, "curriculum", id] as const,
}

/** Fetch a single published course by its slug. Returns null when missing. */
export async function getPublishedCourseBySlug(
  slug: string,
): Promise<Course | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .maybeSingle()
  if (error) {
    console.error("[getPublishedCourseBySlug]", error)
    throw error
  }
  return (data as Course | null) ?? null
}

export function usePublishedCourse(slug: string) {
  return useQuery({
    queryKey: publicCoursesKeys.detail(slug),
    queryFn: () => getPublishedCourseBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

/** Public curriculum read for a published course (modules + lessons). */
export function usePublicCurriculum(courseId: string | undefined) {
  return useQuery<CurriculumModule[]>({
    queryKey: publicCoursesKeys.curriculum(courseId ?? ""),
    queryFn: () => getCurriculum(courseId as string),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  })
}
