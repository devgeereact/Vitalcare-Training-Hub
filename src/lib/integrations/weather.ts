// OpenWeather — browser-safe (rate-limited, read-only). Key may be supplied via
// VITE_OPENWEATHER_API_KEY; falls back to the public project key.
const KEY =
  import.meta.env.VITE_OPENWEATHER_API_KEY ||
  "761cf0aaf18a3bc5dc161b9b18496b35"

export interface Weather {
  temp: number
  condition: string
  icon: string
  city: string
}

const CACHE_KEY = "vitalcare-weather"
const TTL_MS = 5 * 60 * 1000

export async function getWeather(city = "London,GB"): Promise<Weather | null> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const { at, data } = JSON.parse(cached) as { at: number; data: Weather }
      if (Date.now() - at < TTL_MS) return data
    }
  } catch {
    // ignore cache read errors
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city,
      )}&units=metric&appid=${KEY}`,
    )
    if (!res.ok) return null
    const json = await res.json()
    const data: Weather = {
      temp: Math.round(json.main?.temp ?? 0),
      condition: json.weather?.[0]?.main ?? "",
      icon: json.weather?.[0]?.icon ?? "",
      city: json.name ?? city,
    }
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }))
    } catch {
      // ignore cache write errors
    }
    return data
  } catch (err) {
    console.error("[getWeather]", err)
    return null
  }
}
