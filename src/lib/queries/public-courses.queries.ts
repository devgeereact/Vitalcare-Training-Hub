import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { Course } from "@/types/database.types"
import {
  getCategories,
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
  list: () => [...publicCoursesKeys.all, "list"] as const,
  detail: (slug: string) => [...publicCoursesKeys.all, "detail", slug] as const,
  curriculum: (id: string) =>
    [...publicCoursesKeys.all, "curriculum", id] as const,
}

/**
 * Public card shape for a published course, resolved against its category name.
 * `categorySlug` is the marketing catalogue slug when the database category
 * maps to one, used so category pages can filter the live list.
 */
export interface PublicCourseCard {
  id: string
  title: string
  slug: string
  summary: string | null
  categoryId: string | null
  categoryName: string | null
  categorySlug: string | null
  cpdHours: number
  durationMins: number
  cstf: boolean
  thumbnailUrl: string | null
}

/**
 * Fetch all published, non-deleted courses for the public site and map them to
 * card shapes, resolving the category name (and marketing slug) for each.
 */
export async function getPublishedCourses(): Promise<PublicCourseCard[]> {
  const [result, categories] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id, title, slug, summary, category_id, cpd_hours, duration_mins, is_cstf_aligned, thumbnail_url",
      )
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("title", { ascending: true }),
    getCategories(),
  ])
  if (result.error) {
    console.error("[getPublishedCourses]", result.error)
    throw result.error
  }

  const byId = new Map(categories.map((cat) => [cat.id, cat]))

  return (result.data ?? [])
    .filter((row): row is typeof row & { slug: string } => Boolean(row.slug))
    .map((row) => {
      const category = row.category_id ? byId.get(row.category_id) : undefined
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        summary: row.summary,
        categoryId: row.category_id,
        categoryName: category?.name ?? null,
        categorySlug: category?.slug ?? null,
        cpdHours: row.cpd_hours,
        durationMins: row.duration_mins,
        cstf: row.is_cstf_aligned,
        thumbnailUrl: row.thumbnail_url,
      }
    })
}

export function usePublishedCourses() {
  return useQuery({
    queryKey: publicCoursesKeys.list(),
    queryFn: getPublishedCourses,
    staleTime: 5 * 60 * 1000,
  })
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
