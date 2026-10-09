/**
 * Vitalcare Training Hub — brand and company constants.
 * Single source of truth for identity used across marketing site and platform.
 */

export const COMPANY = {
  name: "Vitalcare Training Hub",
  legalName: "Vitalcare Training Hub Ltd",
  companyNumber: "15718997",
  jurisdiction: "England and Wales",
  founded: "May 2024",
  website: "vitalcare.uk",
  siteUrl: "https://vitalcare.uk",
  email: "info@vitalcare.uk",
  phone: "020 8059 8757",
  address: {
    line1: "11 Halesworth Road",
    city: "London",
    postcode: "SE13 7TJ",
  },
  whatsapp: "07427132765",
} as const

/** Public social and contact links shown on the marketing site. */
export const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/in/vitalcare-training-hub-3a837b366/",
  instagram: "https://www.instagram.com/vitalcaretraininghub/",
  // 07427132765 -> international +44 7427132765 for the wa.me deep link.
  whatsapp: "https://wa.me/447427132765",
} as const

export const LEADERSHIP = {
  ceo: {
    name: "Gideon Akinlotan",
    role: "Founder & CEO",
    email: "gideon@vitalcare.uk",
  },
  clinicalDirector: {
    name: "Harni Muharami RN MSc",
    role: "Co-Founder & Clinical Director",
    email: "harni@vitalcare.uk",
  },
} as const

/** Exact sign-off wording for certificates. Never alter. */
export const CERTIFICATE_SIGN_OFF =
  "Overseen by Harni Muharami RN MSc, Clinical Director" as const

/** Standard credentialing phrase for external pages. */
export const CREDENTIAL_PHRASE =
  "CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify" as const

/** Brand palette, extracted from the official Vitalcare SVG logos. */
export const BRAND = {
  navy: "#1b2e6b",
  navyDark: "#142054",
  gold: "#d4a843",
  goldLight: "#e8c26a",
} as const

export const LOGOS = {
  horizontalNavy: "/logos/logo-horizontal-navy.svg",
  horizontalWhite: "/logos/logo-horizontal-white.svg",
  roundNavy: "/logos/logo-round-navy.svg",
  roundWhite: "/logos/logo-round-white.svg",
} as const

export const ACCREDITATION = {
  nhsFramework: "CSTF-aligned",
  cpd: "CPD-accredited",
} as const

export type UserRole = "super_admin" | "admin" | "trainer" | "learner"

/**
 * Payment hand-off for the manual booking process.
 *
 * There is no payment processor. A buyer places an order, pays by the route
 * below, and a member of staff confirms receipt, which is what enrols them.
 * So the buyer has to be told exactly where to pay and what to quote.
 *
 * The destination details are deliberately empty here. Publishing an account
 * number nobody has approved is worse than not publishing one: the screen
 * falls back to "we will email you the details" until the real ones are filled
 * in, and no invented figure is ever shown. Fill these in only from details
 * approved by the person who owns the bank account.
 *
 * `VAT_REGISTERED` drives whether prices and reports mention VAT at all. It is
 * false until the accountant confirms the registration and the rate that
 * applies to training services.
 */
export const PAYMENT = {
  /** Sort code and account number, once approved. Empty means "not published". */
  bankAccountName: "",
  bankSortCode: "",
  bankAccountNumber: "",
  /** The PayPal address or payment link, once approved. */
  paypalAddress: "",
  /** How long a buyer should expect to wait for confirmation. */
  confirmationWindow: "one working day",
  /** Where a buyer chases an unconfirmed payment. */
  supportEmail: "info@vitalcare.uk",
} as const

/**
 * VAT treatment. Not a universal 20%: whether VAT applies to a given training
 * service, and at what rate, is a decision for the company's accountant.
 * Reports show a VAT column only when `registered` is true.
 */
export const VAT = {
  registered: false,
  /** Standard UK rate, used only when `registered` is true. */
  ratePercent: 20,
  registrationNumber: "",
} as const
