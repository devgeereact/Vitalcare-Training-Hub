import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { CalendarDays, UserRound, Eye, BookOpen } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { BannerBand } from "@/components/marketing/BannerBand"
import { Pagination } from "@/components/marketing/Pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { driveImageUrl } from "@/lib/drive-image"
import { usePublishedPosts, type PublicBlogPost } from "@/lib/queries/blog.queries"
import { PageMeta } from "@/components/seo/PageMeta"
import { ErrorState } from "@/components/common/DataState"

const PAGE_SIZE = 12

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function PostCard({ post }: { post: PublicBlogPost }) {
  return (
    <Link
      to={`/resources/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-brand-navy/5">
        {post.featureImageUrl ? (
          <img
            src={driveImageUrl(post.featureImageUrl, 800)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-navy/30">
            <BookOpen className="size-8" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-sans text-lg font-semibold leading-snug tracking-tight text-brand-navy">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-brand-gold" aria-hidden />
            {formatDate(post.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5 text-brand-gold" aria-hidden />
            {post.authorName}
          </span>
          {post.views > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5 text-brand-gold" aria-hidden />
              {post.views}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export default function BlogPage(): React.ReactElement {
  const reduce = useReducedMotion()
  const { data, isLoading, isError, error, refetch } = usePublishedPosts()
  const posts = useMemo(() => data ?? [], [data])

  const featured = posts.slice(0, 3)
  const rest = posts.slice(3)

  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(rest.length / PAGE_SIZE))
  const paged = rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <PageMeta
        title="Insight on healthcare training"
        description="Practical guidance on CSTF compliance, mandatory training, safeguarding and clinical skills, written for the people who run training."
        canonicalPath="/resources/blog"
      />
      <PageHero
        eyebrow="Insights"
        title="Insight on healthcare training"
        description="Practical guidance for training leads in the NHS, care homes and primary care."
      />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            error={error}
            resource="our articles"
            onRetry={refetch}
          />
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-14 text-center">
            <BookOpen className="mx-auto size-8 text-brand-navy/40" aria-hidden />
            <h2 className="mt-4 font-sans text-2xl font-semibold tracking-tight text-brand-navy">
              Articles on the way
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              We are preparing guidance for training leads. Check back soon.
            </p>
          </div>
        ) : (
          <>
            <SectionHeading eyebrow="Latest" title="Featured articles" />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((post, i) => (
                <motion.div
                  key={post.slug}
                  className="h-full"
                  initial={{ opacity: 0, y: reduce ? 0 : 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.06 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>

            {rest.length > 0 ? (
              <div className="mt-20">
                <SectionHeading eyebrow="More reading" title="All articles" />
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paged.map((post, i) => (
                    <motion.div
                      key={post.slug}
                      className="h-full"
                      initial={{ opacity: 0, y: reduce ? 0 : 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.4, delay: reduce ? 0 : Math.min(i, 7) * 0.04 }}
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                </div>
                <Pagination
                  page={page}
                  pageCount={pageCount}
                  onPageChange={setPage}
                  label="Blog pagination"
                  className="mt-12"
                />
              </div>
            ) : null}
          </>
        )}
      </section>

      <BannerBand
        tone="navy"
        eyebrow="Get started"
        heading="Training that earns inspection trust"
        description="Talk to us about training for your team, online or in person, with records you can evidence."
        buttonLabel="Talk to us"
        to="/contact-us"
      />
    </>
  )
}
