import { Link } from "react-router-dom"

/** Gold call-to-action band. */
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
    <section className="bg-brand-gold">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <h2 className="max-w-2xl font-display text-3xl text-brand-navy">
          {heading}
        </h2>
        <Link
          to={to}
          className="inline-flex shrink-0 items-center rounded-md bg-brand-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-gold"
        >
          {buttonLabel}
        </Link>
      </div>
    </section>
  )
}
