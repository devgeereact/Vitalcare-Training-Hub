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
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          Last updated: {updated}
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section, index) => (
            <article
              key={section.heading}
              className="border-l-2 border-brand-gold/40 pl-5"
            >
              <h2 className="flex items-baseline gap-3 font-display text-2xl text-brand-navy">
                <span className="font-sans text-sm font-semibold tabular-nums text-brand-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-base leading-relaxed text-muted-foreground">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="max-w-[65ch]">
                    {p}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
