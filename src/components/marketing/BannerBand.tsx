import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

/**
 * Full-bleed CTA band that breaks between content sections.
 *
 * `tone="navy"` renders a rich navy gradient band with gold accents.
 * `tone="gold"` renders a solid gold band with navy type. Both carry an
 * eyebrow, large serif heading, an accent line and a single CTA.
 */
export function BannerBand({
  eyebrow,
  heading,
  description,
  buttonLabel,
  to,
  tone = "navy",
}: {
  eyebrow?: string
  heading: string
  description?: string
  buttonLabel: string
  to: string
  tone?: "navy" | "gold"
}) {
  const isNavy = tone === "navy"

  return (
    <section
      className={
        isNavy
          ? "relative overflow-hidden bg-gradient-to-br from-[#1b2e6b] via-[#142054] to-[#0d1530]"
          : "relative overflow-hidden bg-brand-gold"
      }
    >
      {isNavy ? (
        <>
          <div
            className="pointer-events-none absolute -left-24 -top-32 size-[26rem] rounded-full bg-brand-gold/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 right-0 size-[22rem] rounded-full bg-brand-gold/10 blur-3xl"
            aria-hidden="true"
          />
        </>
      ) : (
        <div
          className="pointer-events-none absolute -right-20 -top-24 size-[24rem] rounded-full bg-white/25 blur-3xl"
          aria-hidden="true"
        />
      )}

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p
              className={
                isNavy
                  ? "inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold"
                  : "inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-navy/80"
              }
            >
              <span
                className={
                  isNavy
                    ? "h-px w-8 bg-brand-gold/70"
                    : "h-px w-8 bg-brand-navy/50"
                }
                aria-hidden="true"
              />
              {eyebrow}
            </p>
          ) : null}
          <h2
            className={
              isNavy
                ? "mt-4 font-sans font-semibold tracking-tight text-3xl leading-tight text-white sm:text-4xl lg:text-5xl"
                : "mt-4 font-sans font-semibold tracking-tight text-3xl leading-tight text-brand-navy sm:text-4xl lg:text-5xl"
            }
          >
            {heading}
          </h2>
          {description ? (
            <p
              className={
                isNavy
                  ? "mt-5 text-lg leading-relaxed text-white/80"
                  : "mt-5 text-lg leading-relaxed text-brand-navy/80"
              }
            >
              {description}
            </p>
          ) : null}
        </div>

        <Link
          to={to}
          className={
            isNavy
              ? "group inline-flex shrink-0 items-center gap-2 rounded-md bg-brand-gold px-7 py-3.5 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:bg-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              : "group inline-flex shrink-0 items-center gap-2 rounded-md bg-brand-navy px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2 focus-visible:ring-offset-brand-gold"
          }
        >
          {buttonLabel}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  )
}
