import { AlertCircle, BarChart3 } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useProfileMetrics } from "@/lib/queries/profile.queries"
import type { UserRole } from "@/types/database.types"

interface Props {
  userId: string | undefined
  role: UserRole | null
}

/**
 * A row of mini performance metrics tailored to the user's role. Real data
 * pulled from the platform queries. Renders its own loading, empty and error
 * states.
 */
export default function ProfileMetrics({ userId, role }: Props) {
  const { data, isLoading, isError, refetch } = useProfileMetrics(userId, role)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4"
          >
            <Skeleton className="h-7 w-12" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
        <AlertCircle className="size-6 text-destructive" />
        <p className="text-sm text-muted-foreground">
          We could not load your performance metrics.
        </p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <BarChart3 className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No activity to report yet. Your stats appear here once you get going.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {data.map((m) => (
        <div
          key={m.key}
          className="rounded-xl border border-border bg-card p-4 transition hover:border-brand-gold/60"
        >
          <p className="font-display text-3xl leading-none text-brand-navy">
            {m.value.toLocaleString("en-GB")}
            {m.suffix ?? ""}
          </p>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">
            {m.label}
          </p>
        </div>
      ))}
    </div>
  )
}
