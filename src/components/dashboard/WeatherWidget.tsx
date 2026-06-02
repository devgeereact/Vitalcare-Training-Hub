import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { getWeather } from "@/lib/integrations/weather"

/**
 * OpenWeather widget with a live clock. Weather refreshes every 10 minutes;
 * the time updates every second. Hides the weather block if the API is down,
 * but always shows the clock.
 */
export default function WeatherWidget() {
  const { data } = useQuery({
    queryKey: ["weather", "London,GB"],
    queryFn: () => getWeather("London,GB"),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
  })

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
      {/* Clock */}
      <div className="leading-tight">
        <p className="font-display text-lg tabular-nums text-foreground">
          {format(now, "HH:mm")}
          <span className="text-xs text-muted-foreground">{format(now, ":ss")}</span>
        </p>
        <p className="text-xs text-muted-foreground">{format(now, "EEE d MMM yyyy")}</p>
      </div>

      {/* Weather */}
      {data && (
        <>
          <span className="h-9 w-px bg-border" aria-hidden="true" />
          <div className="flex items-center gap-2">
            {data.icon && (
              <img
                src={`https://openweathermap.org/img/wn/${data.icon}.png`}
                alt={data.condition}
                width={28}
                height={28}
                className="size-7"
              />
            )}
            <div className="leading-tight">
              <p className="font-medium text-foreground">{data.temp}°C</p>
              <p className="text-xs text-muted-foreground">
                {data.city} · {data.condition}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
