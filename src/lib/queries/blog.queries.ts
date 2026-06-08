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
  likeCount: number
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
  like_count: number | null
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
    likeCount: 0,
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
    likeCount: r.like_count ?? 0,
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
      "id, slug, title, excerpt, body, feature_image_url, author_name, published_at, views, like_count",
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
      "id, slug, title, excerpt, body, feature_image_url, author_name, published_at, views, like_count",
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

// ── Likes (no sign-in required) ──────────────────────────────────────────────
//
// Anyone can like a post. The server keeps only the aggregate count
// (blog_posts.like_count, toggled through the toggle_blog_like RPC). The browser
// remembers which posts it has liked in localStorage, so a like is one-per-browser
// and survives a refresh without an account.

const LIKED_KEY = "vc-liked-posts"

function readLikedSlugs(): Set<string> {
  if (typeof localStorage === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(LIKED_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [])
  } catch {
    return new Set()
  }
}

/** Whether this browser has liked the given post slug. */
export function isPostLiked(slug: string): boolean {
  return readLikedSlugs().has(slug)
}

/** Record (or clear) this browser's like for a post slug. */
export function setPostLiked(slug: string, liked: boolean): void {
  if (typeof localStorage === "undefined") return
  try {
    const set = readLikedSlugs()
    if (liked) set.add(slug)
    else set.delete(slug)
    localStorage.setItem(LIKED_KEY, JSON.stringify([...set]))
  } catch {
    // localStorage unavailable (private mode, quota): liked state is best-effort.
  }
}

const rpc = sb.rpc as unknown as (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ data: number | null; error: { message: string } | null }>

/**
 * Toggle a like on a published post by slug. Returns the new server count.
 * Works for anonymous and signed-in visitors alike.
 */
export function useToggleBlogLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ slug, liked }: { slug: string; liked: boolean }): Promise<number> => {
      const { data, error } = await rpc("toggle_blog_like", { p_slug: slug, p_liked: liked })
      if (error) throw new Error(error.message)
      return data ?? 0
    },
    onSuccess: (count, { slug }) => {
      // Keep the cached post in sync so the count is correct on revisit.
      qc.setQueryData<PublicBlogPost | null>(blogKeys.detail(slug), (prev) =>
        prev ? { ...prev, likeCount: count } : prev,
      )
    },
  })
}

// ── Admin authoring ──────────────────────────────────────────────────────────

export interface AdminBlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  feature_image_url: string | null
  status: "draft" | "published"
  author_name: string
  published_at: string | null
  views: number
  updated_at: string
}

export interface BlogPostInput {
  id?: string
  title: string
  slug: string
  excerpt: string
  body: string
  feature_image_url: string | null
  status: "draft" | "published"
}

const adminKeys = {
  list: () => [...blogKeys.all, "admin", "list"] as const,
  detail: (id: string) => [...blogKeys.all, "admin", id] as const,
}

/** Turn a title into a URL-safe slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
}

export function useAdminPosts(): UseQueryResult<AdminBlogPost[], Error> {
  return useQuery({
    queryKey: adminKeys.list(),
    queryFn: async (): Promise<AdminBlogPost[]> => {
      const { data, error } = await sb
        .from("blog_posts")
        .select(
          "id, slug, title, excerpt, body, feature_image_url, status, author_name, published_at, views, updated_at",
        )
        .order("updated_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as AdminBlogPost[]
    },
  })
}

export function useAdminPost(
  id: string | undefined,
): UseQueryResult<AdminBlogPost | null, Error> {
  return useQuery({
    queryKey: adminKeys.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: async (): Promise<AdminBlogPost | null> => {
      const { data, error } = await sb
        .from("blog_posts")
        .select(
          "id, slug, title, excerpt, body, feature_image_url, status, author_name, published_at, views, updated_at",
        )
        .eq("id", id as string)
        .maybeSingle()
      if (error) throw error
      return (data as AdminBlogPost) ?? null
    },
  })
}

export function useSavePost(authorId: string | undefined, authorName: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: BlogPostInput): Promise<string> => {
      const now = new Date().toISOString()
      const base = {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        body: input.body,
        feature_image_url: input.feature_image_url,
        status: input.status,
        updated_at: now,
      }
      if (input.id) {
        // On publish, stamp published_at if not already set.
        const patch: Record<string, unknown> = { ...base }
        if (input.status === "published") patch.published_at = now
        const { error } = await sb.from("blog_posts").update(patch).eq("id", input.id)
        if (error) throw error
        return input.id
      }
      const { data, error } = await sb
        .from("blog_posts")
        .insert({
          ...base,
          author_id: authorId ?? null,
          author_name: authorName,
          published_at: input.status === "published" ? now : null,
        })
        .select("id")
        .single()
      if (error) throw error
      return (data as { id: string }).id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blogKeys.all })
    },
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("blog_posts").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: blogKeys.all }),
  })
}
