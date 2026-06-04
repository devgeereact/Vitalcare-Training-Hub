import { useState } from "react"
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
  Megaphone,
  Loader2,
} from "lucide-react"
import AuthoringHeader from "@/components/authoring/AuthoringHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { COMPANY } from "@/lib/constants"
import {
  useAdminPosts,
  useDeletePost,
  type AdminBlogPost,
} from "@/lib/queries/blog.queries"

const AUDIENCES = [
  { value: "everyone", label: "Everyone" },
  { value: "all_staff", label: "Staff" },
  { value: "all_trainers", label: "Trainers" },
  { value: "all_learners", label: "Learners" },
] as const

/**
 * Notify subscribers about a published post. Drafts a campaign for a chosen
 * group; the send is BCC, so no recipient address is exposed. Sending is a
 * deliberate admin action, never automatic.
 */
function NotifyButton({ post }: { post: AdminBlogPost }) {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [audience, setAudience] = useState<string>("everyone")
  const [message, setMessage] = useState(
    `New article: ${post.title}\n\n${post.excerpt}\n\nRead it: https://${COMPANY.website}/resources/blog/${post.slug}`,
  )
  const [sending, setSending] = useState(false)

  async function send() {
    setSending(true)
    try {
      const { error } = await supabase.from("email_campaigns").insert({
        subject: `New from Vitalcare: ${post.title}`,
        message,
        audience,
        scheduled_at: new Date().toISOString(),
        status: "scheduled",
        created_by: session?.user.id ?? null,
      })
      if (error) throw error
      toast.success("Campaign queued", {
        description: "Recipients are BCC'd and will receive it shortly.",
      })
      setOpen(false)
    } catch (e) {
      toast.error("Could not queue campaign", {
        description: e instanceof Error ? e.message : "Admin only.",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title="Notify subscribers"
        onClick={() => setOpen(true)}
      >
        <Megaphone className="size-4 text-brand-navy" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify about this article</DialogTitle>
            <DialogDescription>
              Send a one-off email to a group. Recipients are BCC'd, so no
              address is shared.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Send to</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="campaign-message">Message</Label>
              <Textarea
                id="campaign-message"
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={send} disabled={sending || message.trim().length < 10}>
              {sending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Megaphone className="mr-2 size-4" />
              )}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

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
                    <>
                      <NotifyButton post={post} />
                      <Button asChild variant="ghost" size="icon" title="View live">
                        <a
                          href={`/resources/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                    </>
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
