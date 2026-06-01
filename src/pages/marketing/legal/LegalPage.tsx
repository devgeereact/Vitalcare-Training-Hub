import { PageHero } from "@/components/marketing/PageHero"

export interface LegalSection {
  heading: string
  paragraphs: string[]
}

/** Shared layout for legal and policy pages. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string
  updated: string
  intro?: string
  sections: LegalSection[]
}) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} description={intro} />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-lg font-semibold text-brand-navy">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
