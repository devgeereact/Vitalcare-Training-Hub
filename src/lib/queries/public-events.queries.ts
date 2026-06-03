/**
 * Public events query for the marketing Events page.
 *
 * Reads upcoming public training sessions for anonymous visitors. Row Level
 * Security on training_sessions already permits SELECT where is_public is true
 * (policy sessions_read: is_public OR auth.uid() IS NOT NULL), so this runs for
 * unauthenticated callers. The course title is joined via the embedded courses
 * relationship, which the courses_read policy exposes for published courses.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

export interface PublicEvent {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  venue: string | null
  is_virtual: boolean
  course_title: string | null
}

interface PublicEventRow {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  venue: string | null
  is_virtual: boolean
  courses: { title: string } | null
}

export const publicEventsKeys = {
  all: ["public-events"] as const,
  list: () => [...publicEventsKeys.all, "list"] as const,
}

async function getPublicEvents(): Promise<PublicEvent[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select(
      "id, title, description, starts_at, ends_at, venue, is_virtual, courses(title)",
    )
    .eq("is_public", true)
    .is("deleted_at", null)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })

  if (error) {
    console.error("[getPublicEvents]", error)
    throw error
  }

  const rows = (data ?? []) as unknown as PublicEventRow[]
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    venue: row.venue,
    is_virtual: row.is_virtual,
    course_title: row.courses?.title ?? null,
  }))
}

export function usePublicEvents(): UseQueryResult<PublicEvent[], Error> {
  return useQuery({
    queryKey: publicEventsKeys.list(),
    queryFn: getPublicEvents,
    staleTime: 5 * 60 * 1000,
  })
}
