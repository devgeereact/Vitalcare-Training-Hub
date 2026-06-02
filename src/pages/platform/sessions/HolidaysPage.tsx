import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { format, isPast } from "date-fns"
import { CalendarOff, AlertCircle, CalendarDays } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getUpcomingHolidays } from "@/lib/integrations/holidays"

export default function HolidaysPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["holidays", "GB", "list"],
    queryFn: () => getUpcomingHolidays("GB"),
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Holidays</h1>
          <p className="mt-1 text-muted-foreground">
            UK public holidays. These also show on the calendar.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/platform/calendar">
            <CalendarDays className="mr-2 size-4" /> Calendar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>United Kingdom</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : isError || !data ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load holidays. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <CalendarOff className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">No holidays found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((h) => {
                const past = isPast(new Date(`${h.date}T23:59:59`))
                return (
                  <li
                    key={`${h.date}-${h.name}`}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <CalendarOff className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {h.name}
                    </span>
                    {past && (
                      <Badge variant="secondary" className="text-muted-foreground">
                        Past
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(`${h.date}T00:00:00`), "EEE d MMM yyyy")}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
