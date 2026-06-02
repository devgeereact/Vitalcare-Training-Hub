import type { JSX } from "react"
import { Award } from "lucide-react"

export interface TopLearnerItem {
  id: string
  name: string
  completed: number
}

interface Props {
  items: TopLearnerItem[]
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

/** Ranked list of learners by completed courses. Parent owns states. */
export function TopLearnersList({ items }: Props): JSX.Element {
  return (
    <ul className="-my-1 divide-y divide-border">
      {items.map((l, i) => (
        <li
          key={l.id}
          className="flex items-center gap-3 rounded-lg px-1 py-3 transition-colors hover:bg-muted/50"
        >
          <span className="w-5 shrink-0 text-center font-display text-sm text-muted-foreground tabular-nums">
            {i + 1}
          </span>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-navy/10 text-xs font-semibold text-brand-navy">
            {initials(l.name) || "?"}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {l.name}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success tabular-nums">
            <Award className="size-3" aria-hidden="true" />
            {l.completed}
          </span>
        </li>
      ))}
    </ul>
  )
}
