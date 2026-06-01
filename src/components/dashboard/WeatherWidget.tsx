import { useQuery } from "@tanstack/react-query"
import { getWeather } from "@/lib/integrations/weather"

/** Small OpenWeather widget. Hides itself if the API is unavailable. */
export default function WeatherWidget() {
  const { data } = useQuery({
    queryKey: ["weather", "London,GB"],
    queryFn: () => getWeather("London,GB"),
    staleTime: 30 * 60 * 1000,
    retry: false,
  })

  if (!data) return null

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
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
  )
}
