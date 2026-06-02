import { supabase } from "@/lib/supabase/client"

// Google Calendar — public read via API key (browser-safe). Values may be set
// via VITE_GCAL_* env; fall back to the project's public calendar.
const KEY =
  import.meta.env.VITE_GCAL_API_KEY ||
  "AIzaSyACgoU9eUwvCMnsII8Gb1KG2J2w5ycg7Bc"
const CALENDAR_ID =
  import.meta.env.VITE_GCAL_CALENDAR_ID ||
  "01812237bb45c7fec4c2561a9102d5f474397f5a3238e2c9530507e93a51bffa@group.calendar.google.com"

export interface GcalEvent {
  id: string
  title: string
  start: string
  end: string
}

/** Read upcoming events from the public Google Calendar. Returns [] on failure. */
export async function getGcalEvents(
  timeMin: string,
  timeMax: string,
): Promise<GcalEvent[]> {
  try {
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events` +
      `?key=${KEY}&singleEvents=true&orderBy=startTime` +
      `&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`
    const res = await fetch(url)
    if (!res.ok) {
      console.error("[getGcalEvents]", res.status)
      return []
    }
    const json = await res.json()
    return (json.items ?? [])
      .map((e: Record<string, { dateTime?: string; date?: string } | string>) => {
        const start = e.start as { dateTime?: string; date?: string }
        const end = e.end as { dateTime?: string; date?: string }
        return {
          id: `gcal:${e.id}`,
          title: (e.summary as string) ?? "Busy",
          start: start?.dateTime ?? start?.date ?? "",
          end: end?.dateTime ?? end?.date ?? "",
        }
      })
      .filter((e: GcalEvent) => e.start)
  } catch (err) {
    console.error("[getGcalEvents]", err)
    return []
  }
}

// ─── Create a Google Calendar event with a Google Meet link ──────────────────
// Calls the `gmeet-create-event` Edge Function, which holds the connected
// Google account's refresh token server-side and creates the event with
// conferenceData (Meet). The browser never sees Google secrets.

export interface CreateMeetEventInput {
  title: string
  description?: string
  /** ISO 8601 start. */
  start: string
  /** ISO 8601 end. */
  end: string
  location?: string
}

export interface CreateMeetEventResult {
  /** A real Google Meet URL, when Google is connected and the call succeeds. */
  meetUrl: string | null
  /** The created Google Calendar event id, when available. */
  eventId: string | null
  /** True when no Google account is connected (caller should fall back). */
  notConnected: boolean
}

interface GmeetFnResponse {
  meetUrl?: string | null
  eventId?: string | null
  htmlLink?: string | null
  error?: string
  notConnected?: boolean
}

/**
 * Create a Google Calendar event with a Meet link via the Edge Function.
 * Never throws: on any failure it returns a result with `meetUrl: null` so the
 * caller can fall back gracefully (for example to a Jitsi room).
 */
export async function createMeetEvent(
  input: CreateMeetEventInput,
): Promise<CreateMeetEventResult> {
  try {
    const { data, error } = await supabase.functions.invoke<GmeetFnResponse>(
      "gmeet-create-event",
      {
        body: {
          title: input.title,
          description: input.description ?? "",
          start: input.start,
          end: input.end,
          location: input.location ?? "Online (Google Meet)",
          withMeet: true,
        },
      },
    )
    if (error) {
      // A 409 from the function (Google not connected) surfaces here as an
      // invoke error; treat it as "not connected" so the caller falls back.
      console.error("[createMeetEvent]", error)
      return { meetUrl: null, eventId: null, notConnected: true }
    }
    if (data?.notConnected) {
      return { meetUrl: null, eventId: null, notConnected: true }
    }
    return {
      meetUrl: data?.meetUrl ?? null,
      eventId: data?.eventId ?? null,
      notConnected: false,
    }
  } catch (err) {
    console.error("[createMeetEvent]", err)
    return { meetUrl: null, eventId: null, notConnected: false }
  }
}
