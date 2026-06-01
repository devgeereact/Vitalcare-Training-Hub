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
    <section className="bg-brand-navy">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 max-w-3xl font-display text-4xl text-white lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg text-white/80">{description}</p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  )
}
