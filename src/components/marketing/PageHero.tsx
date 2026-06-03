import type { ReactNode } from "react"

/** Compact navy hero used by interior marketing pages. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden bg-brand-navy">
      {/* Soft brand gradient + gold glow */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy to-brand-navy-dark"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand-gold/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-gold">
            <span className="h-px w-6 bg-brand-gold/70" aria-hidden="true" />
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-white lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/80">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  )
}
