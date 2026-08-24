import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  loading?: boolean
  hint?: string
}

export function StatCard({ label, value, icon: Icon, loading, hint }: StatCardProps) {
  return (
    <Card>
      {/* Same responsive shape as GradientStatCard: stacked on phones so the
          label has the full card width to wrap into. */}
      <CardContent className="flex flex-col items-start gap-2.5 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-12">
          <Icon className="size-5 sm:size-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-snug text-muted-foreground sm:text-sm">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <p className="font-display text-2xl leading-tight text-foreground sm:text-3xl">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
