import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  ExternalLink,
  AlertCircle,
  BookOpen,
} from "lucide-react"
import AuthoringHeader from "@/components/authoring/AuthoringHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminPosts, useDeletePost } from "@/lib/queries/blog.queries"

export default function BlogAdminPage(): React.ReactElement {
  const { data, isLoading, isError, refetch } = useAdminPosts()
  const del = useDeletePost()

  return (
    <div className="space-y-6">
      <AuthoringHeader />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Write and publish articles for the public blog.
        </p>
        <Button asChild>
          <Link to="/platform/blog/new">
            <Plus className="mr-2 size-4" /> New post
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load posts. The blog table may not be deployed yet.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <BookOpen className="size-8 text-brand-navy/40" />
            <p className="text-sm text-muted-foreground">
              No posts yet. Write your first article.
            </p>
            <Button asChild size="sm">
              <Link to="/platform/blog/new">
                <Plus className="mr-2 size-4" /> New post
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-brand-navy">
                      {post.title}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={
                        post.status === "published"
                          ? "text-success"
                          : "text-muted-foreground"
                      }
                    >
                      {post.status}
                    </Badge>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>Updated {formatDistanceToNow(new Date(post.updated_at))} ago</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" /> {post.views}
                    </span>
                    <code className="rounded bg-muted px-1.5 py-0.5">{post.slug}</code>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {post.status === "published" ? (
                    <Button asChild variant="ghost" size="icon" title="View live">
                      <a
                        href={`/resources/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  ) : null}
                  <Button asChild variant="ghost" size="icon" title="Edit">
                    <Link to={`/platform/blog/${post.id}`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    disabled={del.isPending}
                    onClick={() => {
                      if (!confirm(`Delete "${post.title}"? This cannot be undone.`))
                        return
                      del.mutate(post.id, {
                        onSuccess: () => toast.success("Post deleted"),
                        onError: () => toast.error("Could not delete"),
                      })
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
