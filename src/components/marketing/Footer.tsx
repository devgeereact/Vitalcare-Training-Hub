import { Link } from "react-router-dom"
import { MapPin, Mail, Phone, ShieldCheck } from "lucide-react"
import { LEGAL_LINKS } from "@/data/nav"
import { COMPANY, CREDENTIAL_PHRASE } from "@/lib/constants"

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Our Courses",
    links: [
      { label: "All Courses", href: "/our-courses" },
      { label: "Mandatory Care", href: "/our-courses/mandatory-care" },
      { label: "Safeguarding", href: "/our-courses/safeguarding" },
      { label: "Clinical Care", href: "/our-courses/clinical-care" },
      { label: "First Aid", href: "/our-courses/first-aid" },
      { label: "Mental Health", href: "/our-courses/mental-health" },
    ],
  },
  {
    heading: "Training Solutions",
    links: [
      { label: "NHS Trusts & Hospitals", href: "/training-solutions/nhs-trusts" },
      { label: "Care Homes", href: "/training-solutions/care-homes" },
      { label: "GP Practices", href: "/training-solutions/gp-practices" },
      { label: "Individual Professionals", href: "/training-solutions/individual-professionals" },
      { label: "Group & Corporate", href: "/training-solutions/group-corporate" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about-us" },
      { label: "Accreditations", href: "/resources/accreditations" },
      { label: "Blog", href: "/resources/blog" },
      { label: "Events", href: "/resources/events" },
      { label: "Contact Us", href: "/contact-us" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Learning Platform", href: "/platform/dashboard" },
      { label: "Verify a Certificate", href: "/resources/verify-certificate" },
      { label: "Sign in", href: "/sign-in" },
      { label: "Get started", href: "/sign-up" },
    ],
  },
]

const LINK =
  "text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy rounded-sm"

const phoneHref = `tel:${COMPANY.phone.replace(/\s/g, "")}`
const currentYear = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top: brand + link columns */}
        <div className="grid gap-10 py-14 lg:grid-cols-12">
          {/* Brand block */}
          <div className="lg:col-span-4">
            <Link
              to="/"
              className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              aria-label="Vitalcare Training Hub home"
            >
              <img
                src="/logos/logo-horizontal-white.svg"
                alt="Vitalcare Training Hub"
                className="h-10 w-auto"
                width={200}
                height={40}
              />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
              Healthcare training that earns NHS trust. Overseen by a registered
              nurse and verifiable at inspection.
            </p>

            <address className="mt-6 space-y-3 text-sm not-italic text-white/70">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-gold" aria-hidden="true" />
                <span>
                  {COMPANY.address.line1}, {COMPANY.address.city}{" "}
                  {COMPANY.address.postcode}
                </span>
              </p>
              <p className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-brand-gold" aria-hidden="true" />
                <a href={`mailto:${COMPANY.email}`} className={LINK}>
                  {COMPANY.email}
                </a>
              </p>
              <p className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-brand-gold" aria-hidden="true" />
                <a href={phoneHref} className={LINK}>
                  {COMPANY.phone}
                </a>
              </p>
            </address>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:col-span-8">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <h3 className="text-sm font-semibold text-white">{col.heading}</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link to={l.href} className={LINK}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Credential line */}
        <div className="flex flex-col gap-3 border-t border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <ShieldCheck className="size-4 text-brand-gold" aria-hidden="true" />
            {CREDENTIAL_PHRASE}
          </p>
          <Link
            to="/resources/verify-certificate"
            className="inline-flex w-fit items-center rounded-md border border-brand-gold/60 px-4 py-2 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
          >
            Verify a certificate
          </Link>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            Copyright © {currentYear} {COMPANY.legalName}. Company No.{" "}
            {COMPANY.companyNumber}. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {LEGAL_LINKS.map((l, i) => (
              <span key={l.href} className="flex items-center">
                {i > 0 && <span className="px-2 text-white/20">|</span>}
                <Link
                  to={l.href}
                  className="rounded-sm transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
                >
                  {l.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
