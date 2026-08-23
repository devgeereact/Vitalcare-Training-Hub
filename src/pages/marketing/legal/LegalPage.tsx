import { motion, useReducedMotion, type Variants } from "framer-motion"
import { FileText } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { PageMeta } from "@/components/seo/PageMeta"

export interface LegalSection {
  heading: string
  paragraphs: string[]
}

/** Turn a heading into a stable anchor id for in-page navigation. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/** Shared premium layout for legal and policy pages. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
  canonicalPath,
}: {
  title: string
  updated: string
  intro?: string
  sections: LegalSection[]
  /** The route this page is served at, used as its canonical URL. */
  canonicalPath: string
}) {
  const reduce = useReducedMotion()

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] },
    },
  }

  return (
    <>
      {/* Every legal page shares this layout, so metadata lives here once and
          each page supplies its own title, description and canonical path. */}
      <PageMeta
        title={title}
        description={intro ?? `${title} for Vitalcare Training Hub Ltd.`}
        canonicalPath={canonicalPath}
      />
      <PageHero eyebrow="Legal" title={title} description={intro} />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          {/* Sticky contents rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
                <span className="h-px w-8 bg-brand-gold/70" aria-hidden="true" />
                On this page
              </p>
              <nav className="mt-5 space-y-1">
                {sections.map((section, index) => (
                  <a
                    key={section.heading}
                    href={`#${slugify(section.heading)}`}
                    className="flex items-baseline gap-3 rounded-md px-2 py-1.5 text-sm leading-snug text-muted-foreground transition-colors hover:bg-muted/60 hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                  >
                    <span className="font-sans text-xs font-semibold tabular-nums text-brand-gold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.heading}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Body */}
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <FileText
                className="size-3.5 text-brand-gold"
                aria-hidden="true"
              />
              Last updated: {updated}
            </p>

            <div className="mt-10 space-y-12">
              {sections.map((section, index) => (
                <motion.article
                  key={section.heading}
                  id={slugify(section.heading)}
                  variants={item}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-60px" }}
                  className="scroll-mt-28 border-l-2 border-brand-gold/40 pl-6"
                >
                  <h2 className="flex items-baseline gap-3 font-sans font-semibold tracking-tight text-2xl leading-tight text-brand-navy sm:text-3xl">
                    <span className="font-sans text-sm font-semibold tabular-nums text-brand-gold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.heading}
                  </h2>
                  <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                    {section.paragraphs.map((paragraph, i) => (
                      <p key={i} className="max-w-[65ch]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
