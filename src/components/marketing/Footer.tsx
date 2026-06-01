import { Link } from "react-router-dom"
import { NAV_ITEMS, LEGAL_LINKS } from "@/data/nav"
import { COMPANY } from "@/lib/constants"

const flatLinks = NAV_ITEMS.flatMap((item) =>
  item.children ? item.children : item.href ? [{ label: item.label, href: item.href }] : [],
)

export function Footer() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <img
            src="/logos/logo-horizontal-white.svg"
            alt="Vitalcare Training Hub"
            className="h-10 w-auto"
          />
          <p className="mt-4 max-w-xs text-sm text-white/75">
            CSTF-aligned, CPD-accredited healthcare training, overseen by a
            registered nurse.
          </p>
          <p className="mt-4 text-sm text-white/60">
            {COMPANY.legalName}
            <br />
            Company No. {COMPANY.companyNumber}
            <br />
            {COMPANY.address.line1}, {COMPANY.address.city} {COMPANY.address.postcode}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
            Quick links
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {flatLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-white/75 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
            Legal
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-white/75 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-1 text-sm text-white/75">
            <p>{COMPANY.phone}</p>
            <p>{COMPANY.email}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-white/60 sm:px-6 lg:px-8">
          © 2026 {COMPANY.legalName}. Company No. {COMPANY.companyNumber}. All
          rights reserved.
        </div>
      </div>
    </footer>
  )
}
