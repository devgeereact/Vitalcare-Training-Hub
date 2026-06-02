import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { CalendarEvent } from "@/types/database.types"

export const calendarKeys = {
  events: () => ["calendar-events"] as const,
}

export function useCalendarEvents() {
  return useQuery({
    queryKey: calendarKeys.events(),
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order("starts_at", { ascending: true })
      if (error) {
        console.error("[useCalendarEvents]", error)
        throw error
      }
      return (data ?? []) as CalendarEvent[]
    },
  })
}

export interface CalendarEventInput {
  title: string
  description: string
  starts_at: string
  ends_at: string
  all_day: boolean
  color: string
}

export function useCalendarEventMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: calendarKeys.events() })

  const create = useMutation({
    mutationFn: async (input: CalendarEventInput & { createdBy: string }) => {
      const { error } = await supabase.from("calendar_events").insert({
        title: input.title.trim(),
        description: input.description.trim() || null,
        starts_at: new Date(input.starts_at).toISOString(),
        ends_at: new Date(input.ends_at).toISOString(),
        all_day: input.all_day,
        color: input.color,
        created_by: input.createdBy,
      })
      if (error) {
        console.error("[calendar create]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async (input: { id: string } & CalendarEventInput) => {
      const { error } = await supabase
        .from("calendar_events")
        .update({
          title: input.title.trim(),
          description: input.description.trim() || null,
          starts_at: new Date(input.starts_at).toISOString(),
          ends_at: new Date(input.ends_at).toISOString(),
          all_day: input.all_day,
          color: input.color,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
      if (error) {
        console.error("[calendar update]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id)
      if (error) {
        console.error("[calendar remove]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
