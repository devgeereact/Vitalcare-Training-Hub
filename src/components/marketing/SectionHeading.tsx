import type { ReactNode } from "react"

/**
 * Shared section header: gold uppercase eyebrow, large serif heading and an
 * optional subheading. Used to keep marketing sections visually consistent.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: "left" | "center"
  action?: ReactNode
}) {
  const centered = align === "center"

  return (
    <div
      className={
        action
          ? "flex flex-wrap items-end justify-between gap-4"
          : centered
            ? "mx-auto max-w-2xl text-center"
            : "max-w-2xl"
      }
    >
      <div className={centered && !action ? "" : "max-w-2xl"}>
        {eyebrow ? (
          <p
            className={
              centered && !action
                ? "inline-flex items-center justify-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold-ink"
                : "inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold-ink"
            }
          >
            <span className="h-px w-8 bg-brand-gold/70" aria-hidden="true" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-3 font-sans font-semibold tracking-tight text-3xl leading-tight text-brand-navy sm:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
