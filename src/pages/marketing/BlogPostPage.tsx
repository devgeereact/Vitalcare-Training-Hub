import { useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
  Eye,
  Heart,
  Loader2,
  Share2,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { driveImageUrl } from "@/lib/drive-image"
import {
  usePublishedPost,
  useToggleBlogLike,
  isPostLiked,
  setPostLiked,
  incrementBlogView,
} from "@/lib/queries/blog.queries"
import { PageMeta, SITE_URL } from "@/components/seo/PageMeta"
import { ErrorState } from "@/components/common/DataState"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function BlogPostPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>()
  const { data: post, isLoading, isError, error, refetch } = usePublishedPost(slug)
  const toggle = useToggleBlogLike()

  // Register a view once the post resolves.
  useEffect(() => {
    if (post?.slug) void incrementBlogView(post.slug)
  }, [post?.slug])

  if (isLoading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="mt-6 aspect-[16/9] w-full rounded-2xl" />
        <Skeleton className="mt-6 h-40 w-full" />
      </section>
    )
  }

  // A failed request is not a missing article. Saying "that article does not
  // exist" when the fetch broke tells the reader the wrong thing and buries the
  // defect.
  if (isError) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <PageMeta title="Article unavailable" noIndex />
        <ErrorState error={error} resource="this article" onRetry={refetch} />
      </section>
    )
  }

  if (!post) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <PageMeta
          title="Article not found"
          description="That article does not exist or is no longer published."
          noIndex
        />
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-brand-navy">
          Article not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          That article does not exist or is no longer published.
        </p>
        <Link
          to="/resources/blog"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-navy px-6 py-3 text-sm font-semibold text-white hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          <ArrowLeft className="size-4" /> All articles
        </Link>
      </section>
    )
  }

  const paragraphs = post.body.split(/\n{2,}/).filter(Boolean)
  const canLike = Boolean(post.id)
  // localStorage is the source of truth for this browser's like (one per browser,
  // no sign-in). The toggle mutation's pending/settled state re-renders this,
  // and the server count is kept fresh in the query cache on success.
  const liked = isPostLiked(post.slug)
  const likeCount = post.likeCount

  function onLike() {
    if (!post || toggle.isPending) return
    const next = !liked
    setPostLiked(post.slug, next) // optimistic: flips the heart on the next render
    toggle.mutate(
      { slug: post.slug, liked: next },
      {
        onError: (e) => {
          setPostLiked(post.slug, !next) // roll back
          toast.error(e instanceof Error ? e.message : "Could not update")
        },
      },
    )
  }

  async function onShare() {
    const url = window.location.href
    const shareData = { title: post!.title, text: post!.excerpt ?? post!.title, url }
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData)
        return
      }
    } catch {
      // user cancelled or share unsupported; fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard")
    } catch {
      toast.error("Could not copy the link")
    }
  }

  const heroImage = post.featureImageUrl ? driveImageUrl(post.featureImageUrl, 1600) : null

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { "@type": "Person", name: post.authorName },
    publisher: {
      "@type": "Organization",
      name: "Vitalcare Training Hub",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logos/logo-round-navy.svg`,
      },
    },
    mainEntityOfPage: `${SITE_URL}/resources/blog/${post.slug}`,
    ...(heroImage ? { image: heroImage } : {}),
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <PageMeta
        title={post.title}
        description={post.excerpt}
        canonicalPath={`/resources/blog/${post.slug}`}
        image={heroImage ?? undefined}
        type="article"
        publishedTime={post.publishedAt}
        jsonLd={articleSchema}
      />
      <Link
        to="/resources/blog"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-navy/70 transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
      >
        <ArrowLeft className="size-4" /> All articles
      </Link>

      {/* Hero: image with the title and meta over the bottom. */}
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-brand-navy">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
          />
        ) : (
          <div className="aspect-[21/9] w-full bg-gradient-to-br from-[#1b2e6b] via-[#16265a] to-[#0f1b41]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <h1 className="max-w-3xl font-sans text-2xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-brand-gold" aria-hidden />
              {formatDate(post.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="size-4 text-brand-gold" aria-hidden />
              {post.authorName}
            </span>
            {post.views > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-4 text-brand-gold" aria-hidden />
                {post.views} views
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Like + Share, before the content. */}
      <div className="mt-6 flex items-center gap-3 border-b border-border pb-6">
        <button
          type="button"
          onClick={onLike}
          disabled={!canLike || toggle.isPending}
          aria-pressed={liked}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:border-brand-gold hover:bg-brand-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          {toggle.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Heart
              className={liked ? "size-4 fill-brand-gold text-brand-gold" : "size-4"}
              aria-hidden
            />
          )}
          {liked ? "Liked" : "Like"}
          {likeCount > 0 ? <span className="text-muted-foreground">· {likeCount}</span> : null}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:border-brand-gold hover:bg-brand-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          <Share2 className="size-4" aria-hidden /> Share
        </button>
      </div>

      <div className="mt-8 space-y-5">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-foreground">
            {p}
          </p>
        ))}
      </div>
    </article>
  )
}
