import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

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

/** Published courses surfaced as a browsable learning-resource library. */
export function useLibrary() {
  return useQuery({
    queryKey: ["library", "list"],
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
