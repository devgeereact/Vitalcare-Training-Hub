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
