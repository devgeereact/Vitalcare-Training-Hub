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
