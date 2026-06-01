/** Training Solutions sectors for /training-solutions/:sector. */
export interface Sector {
  slug: string
  name: string
  headline: string
  intro: string
  painPoints: string[]
  howWeHelp: string[]
  categorySlugs: string[]
}

export const SECTORS: Sector[] = [
  {
    slug: "nhs-trusts",
    name: "NHS Trusts & Hospitals",
    headline: "Statutory and mandatory training your Trust can evidence",
    intro:
      "CSTF-aligned training that maps to the roles your staff hold, with records your governance teams can produce at inspection.",
    painPoints: [
      "Compliance reporting spread across spreadsheets and disconnected systems",
      "Bank and agency staff arriving without verified, in-date training",
      "Audit preparation that takes weeks of manual collation",
    ],
    howWeHelp: [
      "Training mapped to the Core Skills Training Framework by staff group",
      "Live compliance dashboards by department and staff category",
      "Certificates verifiable at vitalcare.uk/verify, with full audit history",
    ],
    categorySlugs: ["mandatory-care", "clinical-care", "safeguarding", "health-safety-essentials"],
  },
  {
    slug: "care-homes",
    name: "Care Homes & Residential",
    headline: "CQC-ready training for residential and nursing care",
    intro:
      "Training that supports safe care and stands up to inspection, with clinical oversight from a registered nurse.",
    painPoints: [
      "High turnover meaning constant re-training of new starters",
      "Evidencing competence across day and night teams",
      "Keeping mandatory refreshers in date across the whole staff group",
    ],
    howWeHelp: [
      "Fast onboarding with role-based learning paths",
      "Automatic refresher reminders before training expires",
      "Reporting aligned to CQC key lines of enquiry",
    ],
    categorySlugs: ["mandatory-care", "care-skills", "safeguarding", "first-aid"],
  },
  {
    slug: "gp-practices",
    name: "GP Practices & Primary Care",
    headline: "Practical training for primary care teams",
    intro:
      "Statutory, mandatory and clinical training for the whole practice team, from reception to clinical staff.",
    painPoints: [
      "Small teams with no dedicated training lead",
      "Meeting CQC and PCN training expectations",
      "Fitting learning around clinical sessions",
    ],
    howWeHelp: [
      "Online learning staff can complete between clinics",
      "Clear compliance overview for the practice manager",
      "Clinical content overseen by a registered nurse",
    ],
    categorySlugs: ["mandatory-care", "clinical-care", "safeguarding", "business-compliance"],
  },
  {
    slug: "individual-professionals",
    name: "Individual Professionals",
    headline: "CPD-accredited training that moves your career forward",
    intro:
      "Recognised, verifiable training for nurses, carers and allied professionals building their portfolio.",
    painPoints: [
      "Finding training that genuinely counts towards CPD",
      "Proving completed training to current and future employers",
      "Studying around shift patterns",
    ],
    howWeHelp: [
      "CPD-accredited courses with logged hours",
      "Certificates you can share and verify online",
      "Learn at your own pace, on any device",
    ],
    categorySlugs: ["clinical-care", "specialist-care", "mental-health", "first-aid"],
  },
  {
    slug: "group-corporate",
    name: "Group & Corporate Packages",
    headline: "Training at scale for groups and providers",
    intro:
      "Coordinated training across multiple sites, with central reporting and one point of contact.",
    painPoints: [
      "Inconsistent training standards across sites",
      "No single view of compliance for the whole group",
      "Procurement that needs clear pricing and accountability",
    ],
    howWeHelp: [
      "One platform across every site and team",
      "Group-level analytics with per-site breakdowns",
      "A named account contact and transparent pricing",
    ],
    categorySlugs: ["mandatory-care", "health-safety-trainer", "care-trainer", "education-essentials"],
  },
]

export function getSector(slug: string): Sector | undefined {
  return SECTORS.find((s) => s.slug === slug)
}
