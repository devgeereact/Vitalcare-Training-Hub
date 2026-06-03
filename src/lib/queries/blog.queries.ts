import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query"
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { BLOG_POSTS } from "@/data/blog"

// The blog tables are added by migration 051 and are not in the generated
// Database types, so query them through an untyped client view. Results are
// cast to the explicit row shapes below.
const sb = supabase as unknown as SupabaseClient

export interface PublicBlogPost {
  id: string | null
  slug: string
  title: string
  excerpt: string
  body: string
  featureImageUrl: string | null
  authorName: string
  publishedAt: string
  views: number
}

interface BlogPostRow {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  feature_image_url: string | null
  author_name: string
  published_at: string
  views: number
}

/** Static seed posts, used as a fallback before the blog table is deployed. */
function fallbackPosts(): PublicBlogPost[] {
  return BLOG_POSTS.map((p) => ({
    id: null,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    body: p.body,
    featureImageUrl: null,
    authorName: p.author,
    publishedAt: p.date,
    views: 0,
  })).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

function mapRow(r: BlogPostRow): PublicBlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    featureImageUrl: r.feature_image_url,
    authorName: r.author_name,
    publishedAt: r.published_at,
    views: r.views,
  }
}

export const blogKeys = {
  all: ["blog"] as const,
  list: () => [...blogKeys.all, "list"] as const,
  detail: (slug: string) => [...blogKeys.all, "detail", slug] as const,
  likes: (postId: string) => [...blogKeys.all, "likes", postId] as const,
}

async function getPublishedPosts(): Promise<PublicBlogPost[]> {
  const { data, error } = await sb
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, body, feature_image_url, author_name, published_at, views",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })

  // Table not deployed yet (or transient failure): fall back to the seed posts
  // so the public blog keeps working.
  if (error) {
    console.warn("[getPublishedPosts] falling back to seed posts", error.message)
    return fallbackPosts()
  }
  if (!data || data.length === 0) return fallbackPosts()
  return (data as BlogPostRow[]).map(mapRow)
}

export function usePublishedPosts(): UseQueryResult<PublicBlogPost[], Error> {
  return useQuery({
    queryKey: blogKeys.list(),
    queryFn: getPublishedPosts,
    staleTime: 5 * 60 * 1000,
  })
}

async function getPublishedPost(slug: string): Promise<PublicBlogPost | null> {
  const { data, error } = await sb
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, body, feature_image_url, author_name, published_at, views",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (error || !data) {
    const fb = fallbackPosts().find((p) => p.slug === slug)
    return fb ?? null
  }
  return mapRow(data as BlogPostRow)
}

export function usePublishedPost(
  slug: string | undefined,
): UseQueryResult<PublicBlogPost | null, Error> {
  return useQuery({
    queryKey: blogKeys.detail(slug ?? ""),
    queryFn: () => getPublishedPost(slug as string),
    enabled: Boolean(slug),
  })
}

/** Register a view for a published post. Fire and forget. */
export async function incrementBlogView(slug: string): Promise<void> {
  try {
    await sb.rpc("increment_blog_views", { p_slug: slug })
  } catch (err) {
    console.warn("[incrementBlogView]", err)
  }
}

export interface BlogLikeState {
  count: number
  liked: boolean
}

export function usePostLikes(
  postId: string | null,
  userId: string | undefined,
): UseQueryResult<BlogLikeState, Error> {
  return useQuery({
    queryKey: blogKeys.likes(postId ?? "none"),
    enabled: Boolean(postId),
    queryFn: async (): Promise<BlogLikeState> => {
      const { count } = await sb
        .from("blog_post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId as string)
      let liked = false
      if (userId) {
        const { data } = await sb
          .from("blog_post_likes")
          .select("post_id")
          .eq("post_id", postId as string)
          .eq("user_id", userId)
          .maybeSingle()
        liked = Boolean(data)
      }
      return { count: count ?? 0, liked }
    },
  })
}

export function useToggleLike(postId: string | null, userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (liked: boolean) => {
      if (!postId || !userId) throw new Error("Sign in to like posts")
      if (liked) {
        const { error } = await sb
          .from("blog_post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId)
        if (error) throw error
      } else {
        const { error } = await sb
          .from("blog_post_likes")
          .insert({ post_id: postId, user_id: userId })
        if (error) throw error
      }
    },
    onSuccess: () => {
      if (postId) qc.invalidateQueries({ queryKey: blogKeys.likes(postId) })
    },
  })
}
