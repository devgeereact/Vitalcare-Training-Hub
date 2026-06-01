import { PageHero } from "@/components/marketing/PageHero"
import { BLOG_POSTS } from "@/data/blog"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Insight on healthcare training"
        description="Practical guidance for training leads in the NHS, care homes and primary care."
      />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-10">
          {BLOG_POSTS.map((post) => (
            <article key={post.slug} className="border-b border-border pb-10 last:border-0">
              <p className="text-sm text-muted-foreground">
                {formatDate(post.date)} · {post.author}
              </p>
              <h2 className="mt-2 font-display text-2xl text-brand-navy">
                {post.title}
              </h2>
              <p className="mt-3 text-muted-foreground">{post.excerpt}</p>
              <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                {post.body.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
