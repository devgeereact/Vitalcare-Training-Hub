import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

/** Call-to-action band with a navy panel and gold accent. */
export function CTABand({
  heading = "Ready to bring training to your team?",
  buttonLabel = "Contact Us",
  to = "/contact-us",
}: {
  heading?: string
  buttonLabel?: string
  to?: string
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl bg-brand-navy px-6 py-12 shadow-sm sm:px-10 lg:py-14">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand-gold/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-brand-gold"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="max-w-2xl font-sans font-semibold tracking-tight text-3xl leading-tight text-white">
            {heading}
          </h2>
          <Link
            to={to}
            className="group inline-flex shrink-0 items-center gap-2 rounded-md bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:bg-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
          >
            {buttonLabel}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
