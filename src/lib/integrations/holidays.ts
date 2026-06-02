// Public holidays via Nager.Date — free, no API key required.
// https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}

export interface PublicHoliday {
  date: string // YYYY-MM-DD
  name: string
  countryCode: string
}

/** Default to the United Kingdom; the app serves UK healthcare training. */
export const DEFAULT_COUNTRY = "GB"

export async function getPublicHolidays(
  year: number,
  countryCode = DEFAULT_COUNTRY,
): Promise<PublicHoliday[]> {
  try {
    const res = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`,
    )
    if (!res.ok) return []
    const json = (await res.json()) as { date: string; localName: string; name: string }[]
    return json.map((h) => ({
      date: h.date,
      name: h.localName || h.name,
      countryCode,
    }))
  } catch (err) {
    console.error("[getPublicHolidays]", err)
    return []
  }
}

/** Holidays for the current and next year, sorted. */
export async function getUpcomingHolidays(
  countryCode = DEFAULT_COUNTRY,
  fromYear = new Date().getFullYear(),
): Promise<PublicHoliday[]> {
  const [a, b] = await Promise.all([
    getPublicHolidays(fromYear, countryCode),
    getPublicHolidays(fromYear + 1, countryCode),
  ])
  return [...a, ...b].sort((x, y) => x.date.localeCompare(y.date))
}
