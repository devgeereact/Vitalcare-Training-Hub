/** Static blog seed posts for /resources/blog. */
export interface BlogPost {
  slug: string
  title: string
  date: string
  excerpt: string
  body: string
  author: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-cstf-alignment-means",
    title: "What CSTF alignment actually means for your Trust",
    date: "2026-04-14",
    excerpt:
      "The Core Skills Training Framework sets out the statutory and mandatory training NHS staff need. Here is what alignment means in practice, and what it does not.",
    body: "The Core Skills Training Framework (CSTF) gives NHS organisations a common standard for statutory and mandatory training. Aligning training to the framework means content maps to the agreed subjects and learning outcomes for each staff group, so completed training is portable between organisations.\n\nAlignment is not the same as accreditation, and it does not remove a Trust's responsibility to assure competence locally. What it does provide is a shared baseline: when a member of staff moves between organisations, training mapped to the CSTF is recognised, which reduces duplication and gets people into post faster.\n\nAt Vitalcare, our mandatory courses map to the CSTF subjects by staff group, and every certificate is verifiable so your governance team can evidence completion at inspection.",
    author: "Harni Muharami RN MSc",
  },
  {
    slug: "reducing-onboarding-time-in-care-homes",
    title: "Reducing onboarding time in care homes without cutting corners",
    date: "2026-05-02",
    excerpt:
      "High turnover makes onboarding a constant task. Role-based learning paths get new starters safe and productive sooner, with the evidence CQC expects.",
    body: "Care home managers tell us the same thing: by the time a new starter has finished their induction training, two more have joined and the cycle begins again. The instinct is to shorten training, but that creates risk and fails inspection.\n\nA better approach is to structure training into role-based learning paths. A new care assistant follows a clear sequence of statutory, mandatory and care-skills courses, with refreshers scheduled automatically before they expire. Managers see a live view of who is compliant and who is not, rather than chasing paper certificates.\n\nThe result is faster onboarding that still produces the records CQC expects, with clinical content overseen by a registered nurse.",
    author: "Gideon Akinlotan",
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}
