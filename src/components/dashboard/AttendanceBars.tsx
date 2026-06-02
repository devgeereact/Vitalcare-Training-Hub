import type { JSX } from "react"

interface Props {
  labels: string[]
  series: number[]
  total: number
}

// Present, Late, Excused, Absent — matched to AttendanceDonut order.
const BAR_COLOURS = ["#16a34a", "#d4a843", "#1b2e6b", "#dc2626"]

/** Horizontal attendance breakdown bars with counts and percentages. */
export function AttendanceBars({ labels, series, total }: Props): JSX.Element {
  return (
    <ul className="space-y-5 py-2">
      {labels.map((label, i) => {
        const count = series[i] ?? 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <li key={label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: BAR_COLOURS[i % BAR_COLOURS.length],
                  }}
                  aria-hidden="true"
                />
                {label}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {count} ({pct}%)
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${label}: ${pct}%`}
            >
              <div
                className="h-full w-full origin-left rounded-full transition-transform duration-500 ease-out motion-reduce:transition-none"
                style={{
                  transform: `scaleX(${pct / 100})`,
                  backgroundColor: BAR_COLOURS[i % BAR_COLOURS.length],
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
