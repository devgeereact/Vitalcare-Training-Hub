import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

export type ResourceAudience = "learner" | "trainer" | "both"
export type ResourceKind = "document" | "video" | "link" | "slide"

// course_resources + resource_allocations are added in migration 034 and are
// not yet in the generated Database type. We reach them through a minimal typed
// builder so the rest of this file stays fully typed (no `any`).
type DbResult<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>
interface FilterBuilder<T> extends DbResult<T> {
  eq(column: string, value: unknown): FilterBuilder<T>
  in(column: string, values: readonly unknown[]): FilterBuilder<T>
  is(column: string, value: unknown): FilterBuilder<T>
  order(column: string, opts: { ascending: boolean }): FilterBuilder<T>
  maybeSingle(): DbResult<T>
  single(): DbResult<T>
}
interface QueryBuilder {
  select(cols?: string): FilterBuilder<unknown[]>
  insert(values: object): { select(cols: string): { single(): DbResult<{ id: string }> } } & DbResult<unknown>
  update(values: object): { eq(column: string, value: unknown): DbResult<unknown> }
  delete(): { eq(column: string, value: unknown): DbResult<unknown> }
}
function table(name: "course_resources" | "resource_allocations"): QueryBuilder {
  return (supabase.from as unknown as (n: string) => QueryBuilder)(name)
}

export const libraryKeys = {
  all: ["library"] as const,
  resources: (scope: string) => [...libraryKeys.all, "resources", scope] as const,
  allocations: (resourceId: string) =>
    [...libraryKeys.all, "allocations", resourceId] as const,
}

// ─── Row shapes ───────────────────────────────────────────────────────────────
export interface CourseResource {
  id: string
  courseId: string | null
  courseTitle: string | null
  title: string
  description: string | null
  fileUrl: string | null
  linkUrl: string | null
  kind: ResourceKind
  audience: ResourceAudience
  isPublished: boolean
  createdAt: string
}

interface RawResource {
  id: string
  course_id: string | null
  title: string
  description: string | null
  file_url: string | null
  link_url: string | null
  kind: string
  audience: string
  is_published: boolean
  created_at: string
}

async function attachCourseTitles(rows: RawResource[]): Promise<CourseResource[]> {
  const courseIds = [...new Set(rows.map((r) => r.course_id).filter(Boolean))] as string[]
  const titleById = new Map<string, string>()
  if (courseIds.length) {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", courseIds)
    for (const c of courses ?? []) titleById.set(c.id, c.title)
  }
  return rows.map((r) => ({
    id: r.id,
    courseId: r.course_id,
    courseTitle: r.course_id ? titleById.get(r.course_id) ?? "Course" : null,
    title: r.title,
    description: r.description,
    fileUrl: r.file_url,
    linkUrl: r.link_url,
    kind: (["document", "video", "link", "slide"].includes(r.kind)
      ? r.kind
      : "document") as ResourceKind,
    audience: (["learner", "trainer", "both"].includes(r.audience)
      ? r.audience
      : "both") as ResourceAudience,
    isPublished: r.is_published,
    createdAt: r.created_at,
  }))
}

// ─── Reader view (learners + trainers) ────────────────────────────────────────
// RLS already restricts rows to what the current user may see (audience +
// allocation rules). We add a client-side audience filter so a trainer who is
// also enrolled does not see learner-only materials and vice versa.
export function useMyResources(audience: "learner" | "trainer") {
  return useQuery({
    queryKey: libraryKeys.resources(audience),
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<CourseResource[]> => {
      const { data, error } = await table("course_resources")
        .select(
          "id, course_id, title, description, file_url, link_url, kind, audience, is_published, created_at",
        )
        .is("deleted_at", null)
        .eq("is_published", true)
        .in("audience", [audience, "both"])
        .order("created_at", { ascending: false })
      if (error) {
        console.error("[useMyResources]", error)
        throw error
      }
      return attachCourseTitles((data ?? []) as RawResource[])
    },
  })
}

// ─── Admin / staff view (all resources) ───────────────────────────────────────
export function useAllResources() {
  return useQuery({
    queryKey: libraryKeys.resources("all"),
    queryFn: async (): Promise<CourseResource[]> => {
      const { data, error } = await table("course_resources")
        .select(
          "id, course_id, title, description, file_url, link_url, kind, audience, is_published, created_at",
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error) {
        console.error("[useAllResources]", error)
        throw error
      }
      return attachCourseTitles((data ?? []) as RawResource[])
    },
  })
}

// ─── Mutations (staff) ────────────────────────────────────────────────────────
export interface ResourceInput {
  courseId: string | null
  title: string
  description: string
  fileUrl: string
  linkUrl: string
  kind: ResourceKind
  audience: ResourceAudience
  isPublished: boolean
}

function toRow(v: ResourceInput) {
  return {
    course_id: v.courseId,
    title: v.title.trim(),
    description: v.description.trim() || null,
    file_url: v.fileUrl.trim() || null,
    link_url: v.linkUrl.trim() || null,
    kind: v.kind,
    audience: v.audience,
    is_published: v.isPublished,
  }
}

export function useCreateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: ResourceInput): Promise<string> => {
      const { data: auth } = await supabase.auth.getUser()
      const { data, error } = await table("course_resources")
        .insert({ ...toRow(v), created_by: auth.user?.id ?? null })
        .select("id")
        .single()
      if (error) {
        console.error("[useCreateResource]", error)
        throw error
      }
      return data?.id ?? ""
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.all }),
  })
}

export function useUpdateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ResourceInput }) => {
      const { error } = await table("course_resources")
        .update(toRow(values))
        .eq("id", id)
      if (error) {
        console.error("[useUpdateResource]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.all }),
  })
}

export function useDeleteResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await table("course_resources")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error) {
        console.error("[useDeleteResource]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.all }),
  })
}

// ─── Allocations (admins target specific learners) ────────────────────────────
export interface Allocation {
  id: string
  resourceId: string
  learnerId: string
}

export function useAllocations(resourceId: string | null) {
  return useQuery({
    queryKey: libraryKeys.allocations(resourceId ?? "none"),
    enabled: !!resourceId,
    queryFn: async (): Promise<Allocation[]> => {
      const { data, error } = await table("resource_allocations")
        .select("id, resource_id, learner_id")
        .eq("resource_id", resourceId as string)
      if (error) {
        console.error("[useAllocations]", error)
        throw error
      }
      const rows = (data ?? []) as { id: string; resource_id: string; learner_id: string }[]
      return rows.map((r) => ({
        id: r.id,
        resourceId: r.resource_id,
        learnerId: r.learner_id,
      }))
    },
  })
}

/** Replace a resource's targeted allocations with the supplied learner ids.
 *  An empty list clears targeting, so the audience rule governs on its own. */
export function useSetAllocations() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      resourceId,
      learnerIds,
    }: {
      resourceId: string
      learnerIds: string[]
    }) => {
      const { data: auth } = await supabase.auth.getUser()
      const { error: delErr } = await table("resource_allocations")
        .delete()
        .eq("resource_id", resourceId)
      if (delErr) {
        console.error("[useSetAllocations:delete]", delErr)
        throw delErr
      }
      if (learnerIds.length) {
        const { error: insErr } = await table("resource_allocations").insert(
          learnerIds.map((learnerId) => ({
            resource_id: resourceId,
            learner_id: learnerId,
            created_by: auth.user?.id ?? null,
          })),
        )
        if (insErr) {
          console.error("[useSetAllocations:insert]", insErr)
          throw insErr
        }
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: libraryKeys.allocations(vars.resourceId) })
      qc.invalidateQueries({ queryKey: libraryKeys.all })
    },
  })
}

// ─── Legacy export ────────────────────────────────────────────────────────────
// Retained for any callers still importing the old course-as-resource list.
export interface LibraryResource {
  id: string
  title: string
  summary: string
  cpdHours: number
  durationMins: number
  isCstfAligned: boolean
  categoryName: string
  thumbnailUrl: string | null
}

/** @deprecated Superseded by useMyResources / useAllResources. */
export function useLibrary() {
  return useQuery({
    queryKey: ["library", "courses-list"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<LibraryResource[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "id, title, summary, cpd_hours, duration_mins, is_cstf_aligned, category_id, thumbnail_url",
        )
        .eq("is_published", true)
        .is("deleted_at", null)
        .order("title", { ascending: true })
      if (error) {
        console.error("[useLibrary]", error)
        throw error
      }
      const rows = data ?? []
      const catIds = [...new Set(rows.map((r) => r.category_id).filter(Boolean))] as string[]
      const nameById = new Map<string, string>()
      if (catIds.length) {
        const { data: cats } = await supabase
          .from("course_categories")
          .select("id, name")
          .in("id", catIds)
        for (const c of cats ?? []) nameById.set(c.id, c.name)
      }
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary ?? "",
        cpdHours: r.cpd_hours,
        durationMins: r.duration_mins,
        isCstfAligned: r.is_cstf_aligned,
        categoryName: r.category_id ? nameById.get(r.category_id) ?? "General" : "General",
        thumbnailUrl: r.thumbnail_url ?? null,
      }))
    },
  })
}
