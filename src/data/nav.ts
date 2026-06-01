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

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Our Courses", href: "/our-courses" },
  {
    label: "Training Solutions",
    children: [
      { label: "NHS Trusts & Hospitals", href: "/training-solutions/nhs-trusts" },
      { label: "Care Homes & Residential", href: "/training-solutions/care-homes" },
      { label: "GP Practices & Primary Care", href: "/training-solutions/gp-practices" },
      {
        label: "Individual Professionals",
        href: "/training-solutions/individual-professionals",
      },
      { label: "Group & Corporate Packages", href: "/training-solutions/group-corporate" },
    ],
  },
  {
    label: "Resources",
    children: [
      { label: "Learning Platform", href: "/platform" },
      { label: "Accreditations", href: "/resources/accreditations" },
      { label: "Verify Certificate", href: "/resources/verify-certificate" },
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
