/** Public marketing navigation. */
export interface NavChild {
  label: string
  href: string
}

export interface NavItem {
  label: string
  href?: string
  children?: NavChild[]
}

/** Training Solutions sectors. Shown in the FOOTER (removed from the top nav). */
export const TRAINING_SOLUTIONS: NavChild[] = [
  { label: "NHS Trusts & Hospitals", href: "/training-solutions/nhs-trusts" },
  { label: "Care Homes & Residential", href: "/training-solutions/care-homes" },
  { label: "GP Practices & Primary Care", href: "/training-solutions/gp-practices" },
  { label: "Individual Professionals", href: "/training-solutions/individual-professionals" },
  { label: "Group & Corporate Packages", href: "/training-solutions/group-corporate" },
]

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Our Courses", href: "/our-courses" },
  {
    label: "Resources",
    children: [
      { label: "Accreditations", href: "/resources/accreditations" },
      { label: "Blog", href: "/resources/blog" },
      { label: "Events", href: "/resources/events" },
    ],
  },
  { label: "Contact Us", href: "/contact-us" },
]

export const LEGAL_LINKS: NavChild[] = [
  { label: "FAQ", href: "/faq" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
]
