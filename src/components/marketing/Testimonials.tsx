import { Star, Quote } from "lucide-react"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { usePublicTestimonials } from "@/lib/queries/feedback.queries"

/**
 * Approved learner feedback, shown on the public site. Only admin-approved
 * testimonials reach here (RLS). Renders nothing until there are a few, so the
 * section never looks thin or fabricated.
 */
export function Testimonials(): React.ReactElement | null {
  const { data } = usePublicTestimonials(9)
  const items = data ?? []
  if (items.length < 3) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHeading
        eyebrow="What learners say"
        title="Trusted by the people we train"
        subtitle="Verified feedback from learners and training leads, approved before it is published."
      />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((t) => (
          <figure
            key={t.id}
            className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm"
          >
            <Quote className="size-6 text-brand-gold" aria-hidden />
            <div className="mt-3 flex items-center gap-0.5" aria-label={`${t.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < t.rating
                      ? "size-4 fill-brand-gold text-brand-gold"
                      : "size-4 text-border"
                  }
                  aria-hidden
                />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
              {t.comment}
            </blockquote>
            <figcaption className="mt-5 border-t border-border pt-4 text-sm font-semibold text-brand-navy">
              {t.authorName}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
