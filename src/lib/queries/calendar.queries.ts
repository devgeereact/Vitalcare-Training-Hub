import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { CalendarEvent } from "@/types/database.types"

// org_holidays (migration 035) is not in the generated database.types yet.
// We model the row and a minimal query-builder surface so callers stay typed
// without resorting to `any`.
interface OrgHolidayDbRow {
  id: string
  name: string
  starts_on: string
  ends_on: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}
type OrgHolidayInsert = {
  name: string
  starts_on: string
  ends_on: string
  notes: string | null
  created_by?: string | null
  updated_at?: string
}
interface PostgrestResult<T> {
  data: T | null
  error: { message: string } | null
}
interface OrgHolidaysBuilder {
  select(cols: string): {
    order(
      col: string,
      opts: { ascending: boolean },
    ): Promise<PostgrestResult<OrgHolidayDbRow[]>>
  }
  insert(values: OrgHolidayInsert): Promise<PostgrestResult<null>>
  update(values: Partial<OrgHolidayInsert>): {
    eq(col: string, value: string): Promise<PostgrestResult<null>>
  }
  delete(): { eq(col: string, value: string): Promise<PostgrestResult<null>> }
}
function orgHolidaysTable(): OrgHolidaysBuilder {
  return (
    supabase as unknown as { from: (t: string) => OrgHolidaysBuilder }
  ).from("org_holidays")
}

export const calendarKeys = {
  events: () => ["calendar-events"] as const,
  orgHolidays: () => ["org-holidays"] as const,
}

// ─── Organisation holidays / closures ────────────────────────────────────────
// Stored in public.org_holidays (migration 035). These render on the calendar
// and trainer timetable as all-day blocks, independent of any scheduled session.
export interface OrgHoliday {
  id: string
  name: string
  startsOn: string // YYYY-MM-DD
  endsOn: string // YYYY-MM-DD
  notes: string | null
}

export async function getOrgHolidays(): Promise<OrgHoliday[]> {
  const { data, error } = await orgHolidaysTable()
    .select("id, name, starts_on, ends_on, notes")
    .order("starts_on", { ascending: true })
  if (error) {
    console.error("[getOrgHolidays]", error)
    throw error
  }
  return (data ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    startsOn: h.starts_on,
    endsOn: h.ends_on,
    notes: h.notes,
  }))
}

export function useOrgHolidays() {
  return useQuery({
    queryKey: calendarKeys.orgHolidays(),
    queryFn: getOrgHolidays,
    staleTime: 10 * 60 * 1000,
  })
}

export interface OrgHolidayInput {
  name: string
  startsOn: string
  endsOn: string
  notes: string
}

export function useOrgHolidayMutations() {
  const qc = useQueryClient()
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: calendarKeys.orgHolidays() })

  const create = useMutation({
    mutationFn: async (input: OrgHolidayInput & { createdBy: string }) => {
      const { error } = await orgHolidaysTable().insert({
        name: input.name.trim(),
        starts_on: input.startsOn,
        ends_on: input.endsOn || input.startsOn,
        notes: input.notes.trim() || null,
        created_by: input.createdBy,
      })
      if (error) {
        console.error("[org holiday create]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async (input: { id: string } & OrgHolidayInput) => {
      const { error } = await orgHolidaysTable()
        .update({
          name: input.name.trim(),
          starts_on: input.startsOn,
          ends_on: input.endsOn || input.startsOn,
          notes: input.notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
      if (error) {
        console.error("[org holiday update]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await orgHolidaysTable().delete().eq("id", id)
      if (error) {
        console.error("[org holiday remove]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
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
