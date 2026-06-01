import type { LucideIcon } from "lucide-react"
import { Check, CalendarClock } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

/**
 * Branded landing for a module scheduled for a later release. Used where the
 * supporting data model is not built yet, so the route resolves to a real,
 * on-brand page instead of a generic notice.
 */
export default function PlannedModule({
  icon: Icon,
  title,
  description,
  features,
}: {
  icon: LucideIcon
  title: string
  description: string
  features: string[]
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
              <Icon className="size-6" />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-brand-navy">
                <CalendarClock className="size-4" /> Planned for a later release
              </p>
              <p className="text-xs text-muted-foreground">
                Building on the existing platform foundations.
              </p>
            </div>
          </div>

          <ul className="mt-6 space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold">
                  <Check className="size-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
