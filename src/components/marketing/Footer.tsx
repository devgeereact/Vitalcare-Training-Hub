import { Link } from "react-router-dom"
import { LEGAL_LINKS } from "@/data/nav"
import { COMPANY } from "@/lib/constants"

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
      { label: "Register", href: "/sign-up" },
    ],
  },
]

const LINK =
  "text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Link columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-12 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-foreground">{col.heading}</h3>
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

        {/* Fine print line */}
        <div className="border-t border-border py-5 text-sm text-muted-foreground">
          More ways to train:{" "}
          <Link to="/our-courses" className="font-medium text-brand-navy hover:underline">
            Explore our courses
          </Link>{" "}
          or{" "}
          <Link to="/contact-us" className="font-medium text-brand-navy hover:underline">
            contact our team
          </Link>
          . Or call{" "}
          <a
            href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
            className="font-medium text-brand-navy hover:underline"
          >
            {COMPANY.phone}
          </a>
          .
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 border-t border-border py-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            Copyright © 2026 {COMPANY.legalName}. Company No. {COMPANY.companyNumber}.
            All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {LEGAL_LINKS.map((l, i) => (
              <span key={l.href} className="flex items-center">
                {i > 0 && <span className="px-2 text-border">|</span>}
                <Link to={l.href} className="hover:text-foreground hover:underline">
                  {l.label}
                </Link>
              </span>
            ))}
          </nav>
          <p className="md:text-right">United Kingdom</p>
        </div>
      </div>
    </footer>
  )
}
