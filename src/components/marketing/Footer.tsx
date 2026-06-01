import { Link } from "react-router-dom"
import { LEGAL_LINKS } from "@/data/nav"
import { COMPANY } from "@/lib/constants"

const EXPLORE = [
  { label: "Our Courses", href: "/our-courses" },
  { label: "About Us", href: "/about-us" },
  { label: "Accreditations", href: "/resources/accreditations" },
  { label: "Verify a Certificate", href: "/resources/verify-certificate" },
  { label: "Events", href: "/resources/events" },
  { label: "Contact Us", href: "/contact-us" },
]

const LINK =
  "text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"

export function Footer() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* Brand */}
        <div className="lg:col-span-5">
          <img
            src="/logos/logo-horizontal-white.svg"
            alt="Vitalcare Training Hub"
            className="h-10 w-auto"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            CSTF-aligned, CPD-accredited healthcare training, overseen by a
            registered nurse.
          </p>
          <p className="mt-5 text-sm text-white/60">
            {COMPANY.address.line1}, {COMPANY.address.city}{" "}
            {COMPANY.address.postcode}
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 text-sm">
            <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className={LINK}>
              {COMPANY.phone}
            </a>
            <a href={`mailto:${COMPANY.email}`} className={LINK}>
              {COMPANY.email}
            </a>
          </p>
        </div>

        {/* Explore */}
        <div className="lg:col-span-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
            Explore
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
            {EXPLORE.map((l) => (
              <li key={l.href}>
                <Link to={l.href} className={LINK}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div className="lg:col-span-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
            Legal
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link to={l.href} className={LINK}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 {COMPANY.legalName}. All rights reserved.</span>
          <span>Company No. {COMPANY.companyNumber} · England &amp; Wales</span>
        </div>
      </div>
    </footer>
  )
}
