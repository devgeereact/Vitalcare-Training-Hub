/**
 * Vitalcare course catalogue (static marketing data).
 *
 * COURSE_CATEGORIES.count holds the official catalogue size for each category
 * (190+ courses across 15 categories). COURSES lists the published, named
 * courses shown on category pages. The two can differ while the full catalogue
 * is loaded into the platform database.
 */

export interface CourseCategoryMeta {
  id: string
  slug: string
  name: string
  count: number
  icon: string
  blurb: string
}

export interface CourseMeta {
  slug: string
  title: string
  categorySlug: string
  cpdHours: number
  cstf: boolean
  durationMins: number
}

export const COURSE_CATEGORIES: CourseCategoryMeta[] = [
  { id: "01", slug: "mandatory-care", name: "Mandatory Care", count: 14, icon: "ShieldCheck", blurb: "Statutory and mandatory training every care worker needs." },
  { id: "02", slug: "care-skills", name: "Care Skills", count: 17, icon: "HeartHandshake", blurb: "Practical, person-centred care competencies." },
  { id: "03", slug: "safeguarding", name: "Safeguarding", count: 19, icon: "ShieldAlert", blurb: "Protecting adults and children at risk of harm." },
  { id: "04", slug: "clinical-care", name: "Clinical Care", count: 20, icon: "Stethoscope", blurb: "Clinical skills for registered and support staff." },
  { id: "05", slug: "specialist-care", name: "Specialist Care", count: 16, icon: "Activity", blurb: "Condition-specific and specialist care training." },
  { id: "06", slug: "mental-health", name: "Mental Health", count: 6, icon: "Brain", blurb: "Mental health awareness and support skills." },
  { id: "07", slug: "health-safety-essentials", name: "Health and Safety Essentials", count: 14, icon: "HardHat", blurb: "Workplace health and safety fundamentals." },
  { id: "08", slug: "health-safety-trainer", name: "Health and Safety Train the Trainer", count: 15, icon: "GraduationCap", blurb: "Qualify to deliver health and safety training." },
  { id: "09", slug: "care-trainer", name: "Care Train the Trainer", count: 20, icon: "Users", blurb: "Qualify to deliver care training in your organisation." },
  { id: "10", slug: "first-aid", name: "First Aid", count: 9, icon: "Cross", blurb: "Emergency first aid and life support." },
  { id: "11", slug: "business-compliance", name: "Business Compliance", count: 9, icon: "FileCheck", blurb: "Governance, data and regulatory compliance." },
  { id: "12", slug: "soft-skills", name: "Soft Skills", count: 9, icon: "MessagesSquare", blurb: "Communication, teamwork and professional skills." },
  { id: "13", slug: "fire-safety", name: "Fire Safety", count: 2, icon: "Flame", blurb: "Fire awareness and warden training." },
  { id: "14", slug: "food-safety", name: "Food Safety", count: 4, icon: "UtensilsCrossed", blurb: "Food hygiene and safe handling." },
  { id: "15", slug: "education-essentials", name: "Education Essentials", count: 16, icon: "BookOpen", blurb: "Teaching, assessing and learning design." },
]

const slugify = (title: string): string =>
  title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

const make = (
  categorySlug: string,
  entries: Array<[string, number, boolean, number]>,
): CourseMeta[] =>
  entries.map(([title, cpdHours, cstf, durationMins]) => ({
    slug: slugify(title),
    title,
    categorySlug,
    cpdHours,
    cstf,
    durationMins,
  }))

export const COURSES: CourseMeta[] = [
  ...make("mandatory-care", [
    ["Equality, Diversity and Inclusion", 2, true, 90],
    ["Health, Safety and Welfare", 2, true, 90],
    ["Infection Prevention and Control", 2, true, 120],
    ["Moving and Handling of People", 3, true, 150],
    ["Fire Safety Awareness", 1.5, true, 75],
    ["Information Governance and Data Security", 2, true, 90],
    ["Basic Life Support", 2, true, 120],
    ["Safeguarding Adults Level 1", 2, true, 90],
    ["Safeguarding Children Level 1", 2, true, 90],
  ]),
  ...make("care-skills", [
    ["Person-Centred Care", 2, false, 90],
    ["Dignity and Respect in Care", 1.5, false, 75],
    ["Nutrition and Hydration", 2, false, 90],
    ["Pressure Area Care and Tissue Viability", 2, false, 120],
    ["Continence Care", 1.5, false, 75],
    ["End of Life Care", 3, false, 150],
    ["Catheter Care", 2, false, 90],
  ]),
  ...make("safeguarding", [
    ["Safeguarding Adults Level 2", 3, true, 150],
    ["Safeguarding Children Level 2", 3, true, 150],
    ["Safeguarding Children Level 3", 4, true, 180],
    ["Mental Capacity Act and DoLS", 3, true, 150],
    ["Prevent Awareness", 2, true, 90],
    ["Domestic Abuse Awareness", 2, false, 90],
    ["Modern Slavery Awareness", 1.5, false, 75],
  ]),
  ...make("clinical-care", [
    ["Medication Administration", 3, true, 150],
    ["Venepuncture and Cannulation", 4, false, 180],
    ["Wound Care Management", 3, false, 150],
    ["Diabetes Awareness and Management", 2, false, 120],
    ["Catheterisation", 3, false, 150],
    ["Tracheostomy Care", 3, false, 150],
    ["Clinical Observations and NEWS2", 2, false, 120],
  ]),
  ...make("specialist-care", [
    ["Dementia Care", 3, false, 150],
    ["Autism Awareness", 2, false, 120],
    ["Learning Disabilities Awareness", 2, false, 120],
    ["Parkinson's Disease Awareness", 2, false, 90],
    ["Stroke Awareness", 2, false, 90],
    ["Epilepsy Awareness", 1.5, false, 75],
  ]),
  ...make("mental-health", [
    ["Mental Health Awareness", 2, false, 120],
    ["Mental Health First Aid", 4, false, 240],
    ["Suicide Prevention Awareness", 2, false, 90],
    ["Stress and Wellbeing", 1.5, false, 75],
  ]),
  ...make("health-safety-essentials", [
    ["Risk Assessment", 2, false, 120],
    ["COSHH Awareness", 1.5, false, 75],
    ["Display Screen Equipment", 1, false, 60],
    ["Lone Working", 1.5, false, 75],
    ["Slips, Trips and Falls", 1, false, 60],
  ]),
  ...make("health-safety-trainer", [
    ["Health and Safety Train the Trainer", 6, false, 360],
    ["Manual Handling Train the Trainer", 6, false, 360],
    ["Fire Safety Train the Trainer", 5, false, 300],
  ]),
  ...make("care-trainer", [
    ["Basic Life Support Train the Trainer", 6, false, 360],
    ["Medication Train the Trainer", 6, false, 360],
    ["Moving and Handling Train the Trainer", 6, false, 360],
    ["Safeguarding Train the Trainer", 6, false, 360],
  ]),
  ...make("first-aid", [
    ["Emergency First Aid at Work", 6, false, 360],
    ["First Aid at Work", 18, false, 1080],
    ["Paediatric First Aid", 12, false, 720],
    ["Basic Life Support and AED", 3, true, 150],
  ]),
  ...make("business-compliance", [
    ["GDPR and Data Protection", 2, false, 120],
    ["Anti-Bribery and Corruption", 1.5, false, 75],
    ["Whistleblowing", 1.5, false, 75],
    ["Conflict Resolution", 2, false, 120],
  ]),
  ...make("soft-skills", [
    ["Effective Communication", 2, false, 120],
    ["Teamwork and Collaboration", 1.5, false, 90],
    ["Time Management", 1.5, false, 90],
    ["Customer Service in Care", 2, false, 120],
  ]),
  ...make("fire-safety", [
    ["Fire Safety Awareness", 1.5, true, 75],
    ["Fire Warden / Marshal", 3, false, 180],
  ]),
  ...make("food-safety", [
    ["Food Safety and Hygiene Level 1", 1.5, false, 90],
    ["Food Safety and Hygiene Level 2", 3, false, 150],
    ["Allergen Awareness", 1.5, false, 75],
  ]),
  ...make("education-essentials", [
    ["Train the Trainer", 6, false, 360],
    ["Assessing Competence in the Workplace", 4, false, 240],
    ["Coaching and Mentoring", 3, false, 180],
    ["Designing Effective Learning", 3, false, 180],
  ]),
]

export function getCategory(slug: string): CourseCategoryMeta | undefined {
  return COURSE_CATEGORIES.find((c) => c.slug === slug)
}

export function getCoursesByCategory(slug: string): CourseMeta[] {
  return COURSES.filter((c) => c.categorySlug === slug)
}

export const TOTAL_COURSE_COUNT = COURSE_CATEGORIES.reduce(
  (sum, c) => sum + c.count,
  0,
)
