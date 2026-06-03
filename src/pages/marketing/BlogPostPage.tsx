import { useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
  Eye,
  Heart,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import {
  usePublishedPost,
  usePostLikes,
  useToggleLike,
  incrementBlogView,
} from "@/lib/queries/blog.queries"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function BlogPostPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>()
  const { data: post, isLoading } = usePublishedPost(slug)
  const { session } = useAuth()
  const userId = session?.user.id

  const likes = usePostLikes(post?.id ?? null, userId)
  const toggle = useToggleLike(post?.id ?? null, userId)

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

  if (!post) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
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
  const liked = likes.data?.liked ?? false
  const likeCount = likes.data?.count ?? 0

  function onLike() {
    if (!userId) {
      toast.error("Sign in to like this article")
      return
    }
    toggle.mutate(liked, {
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Could not update"),
    })
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <Link
        to="/resources/blog"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-navy/70 transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
      >
        <ArrowLeft className="size-4" /> All articles
      </Link>

      <h1 className="mt-6 font-sans text-3xl font-semibold leading-tight tracking-tight text-brand-navy sm:text-4xl">
        {post.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
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

      {post.featureImageUrl ? (
        <img
          src={post.featureImageUrl}
          alt=""
          className="mt-8 aspect-[16/9] w-full rounded-2xl border border-border object-cover"
        />
      ) : null}

      <div className="mt-8 space-y-5">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-base leading-relaxed text-foreground">
            {p}
          </p>
        ))}
      </div>

      {canLike ? (
        <div className="mt-12 flex items-center gap-4 border-t border-border pt-8">
          <button
            type="button"
            onClick={onLike}
            disabled={toggle.isPending}
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
        </div>
      ) : null}
    </article>
  )
}
