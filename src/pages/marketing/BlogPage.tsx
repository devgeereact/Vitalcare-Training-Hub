import { Link } from "react-router-dom"
import { CalendarDays, UserRound, Mail, BookOpen } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { BLOG_POSTS, type BlogPost } from "@/data/blog"
import { COMPANY } from "@/lib/constants"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** Posts newest first. */
const POSTS: BlogPost[] = [...BLOG_POSTS].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
)

function PostMeta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="size-4 text-brand-gold" aria-hidden="true" />
        {formatDate(post.date)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <UserRound className="size-4 text-brand-gold" aria-hidden="true" />
        {post.author}
      </span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-navy/5 text-brand-navy">
        <BookOpen className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-2xl text-brand-navy">
        Insights are on the way
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        We are preparing practical guidance for training leads in the NHS, care
        homes and primary care. Check back soon.
      </p>
      <Link
        to="/contact-us"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
      >
        <Mail className="size-4" aria-hidden="true" />
        Ask to be kept updated
      </Link>
    </div>
  )
}

export default function BlogPage() {
  const [featured, ...rest] = POSTS

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Insight on healthcare training"
        description="Practical guidance for training leads in the NHS, care homes and primary care."
      />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {POSTS.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-14">
            {/* Featured latest post */}
            {featured ? (
              <article className="rounded-2xl border border-border bg-white p-8 sm:p-10">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
                  Latest
                </p>
                <h2 className="mt-2 font-display text-3xl text-brand-navy">
                  {featured.title}
                </h2>
                <div className="mt-3">
                  <PostMeta post={featured} />
                </div>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                  {featured.body.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </article>
            ) : null}

            {/* Remaining posts */}
            {rest.length > 0 ? (
              <div>
                <h2 className="font-display text-2xl text-brand-navy">
                  More insights
                </h2>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {rest.map((post) => (
                    <article
                      key={post.slug}
                      className="flex flex-col rounded-xl border border-border bg-white p-7"
                    >
                      <PostMeta post={post} />
                      <h3 className="mt-3 font-display text-xl text-brand-navy">
                        {post.title}
                      </h3>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Contact CTA band */}
      <section className="bg-muted/40">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="font-display text-2xl text-brand-navy">
              Want training guidance for your team?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Talk to us about CSTF-aligned, CPD-accredited training. Email{" "}
              {COMPANY.email} or call {COMPANY.phone}.
            </p>
          </div>
          <Link
            to="/contact-us"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-brand-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          >
            <Mail className="size-4" aria-hidden="true" />
            Contact us
          </Link>
        </div>
      </section>
    </>
  )
}
