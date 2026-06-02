import type { JSX } from "react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export type StatTone = "navy" | "gold" | "emerald" | "slate"

const TONE: Record<StatTone, { card: string; icon: string; label: string }> = {
  navy: {
    card: "bg-gradient-to-br from-[#1b2e6b] to-[#142054] text-white",
    icon: "bg-white/15 text-white",
    label: "text-white/70",
  },
  gold: {
    // Deepened gold so white value, label and icon stay legible (WCAG AA).
    card: "bg-gradient-to-br from-[#c0962f] to-[#a87d1f] text-white",
    icon: "bg-white/20 text-white",
    label: "text-white/80",
  },
  emerald: {
    card: "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white",
    icon: "bg-white/15 text-white",
    label: "text-white/75",
  },
  slate: {
    card: "bg-gradient-to-br from-slate-700 to-slate-800 text-white",
    icon: "bg-white/15 text-white",
    label: "text-white/70",
  },
}

interface GradientStatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: StatTone
  hint?: string
  loading?: boolean
}

/** Bold gradient KPI card for the org-wide and trainer dashboards. */
export function GradientStatCard({
  label,
  value,
  icon: Icon,
  tone = "navy",
  hint,
  loading,
}: GradientStatCardProps): JSX.Element {
  const t = TONE[tone]
  return (
    <Card className={`overflow-hidden border-0 shadow-sm ${t.card}`}>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${t.icon}`}
        >
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className={`text-sm ${t.label}`}>{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-16 bg-white/30" />
          ) : (
            <p className="font-display text-2xl leading-tight">{value}</p>
          )}
          {hint && !loading && (
            <p className={`mt-0.5 text-xs ${t.label}`}>{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
