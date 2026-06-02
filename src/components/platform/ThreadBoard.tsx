import { useState } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  MessagesSquare,
  HelpCircle,
  AlertCircle,
  Plus,
  Loader2,
  CheckCircle2,
  MessageSquare,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { useThreads, useCreateThread } from "@/lib/queries/forums.queries"
import AiFieldsButton from "@/components/ai/AiFieldsButton"
import type { ForumThreadKind } from "@/types/database.types"

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function ThreadBoard({
  kind,
  basePath,
  title,
  description,
  emptyText,
  /** Optional course list for scoping a Q&A question. */
  courses,
}: {
  kind: ForumThreadKind
  basePath: string
  title: string
  description: string
  emptyText: string
  courses?: { id: string; title: string }[]
}) {
  const { user } = useAuth()
  const { isAdmin } = useUser()
  const { data, isLoading, isError, refetch } = useThreads(kind)
  const create = useCreateThread()
  const [open, setOpen] = useState(false)
  const [t, setT] = useState("")
  const [b, setB] = useState("")
  const [courseId, setCourseId] = useState<string>("")
  const Icon = kind === "qa" ? HelpCircle : MessagesSquare

  function submit() {
    if (!t.trim() || !user?.id) return
    create
      .mutateAsync({
        kind,
        title: t,
        body: b,
        authorId: user.id,
        courseId: courseId || undefined,
        // Admin-posted discussions notify the whole hub.
        notifyEveryone: kind === "discussion" && isAdmin,
        basePath,
      })
      .then(() => {
        toast.success(kind === "qa" ? "Question posted" : "Topic created")
        setT("")
        setB("")
        setCourseId("")
        setOpen(false)
      })
      .catch(() => toast.error("Could not post. Please try again."))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">{title}</h1>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              {kind === "qa" ? "Ask a question" : "New topic"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{kind === "qa" ? "Ask a question" : "New topic"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {kind === "qa" && courses && courses.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Course
                  </label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Input
                placeholder={kind === "qa" ? "Your question" : "Topic title"}
                value={t}
                onChange={(e) => setT(e.target.value)}
              />
              <Textarea
                placeholder="Add some detail…"
                rows={4}
                value={b}
                onChange={(e) => setB(e.target.value)}
              />
              <div className="flex justify-end">
                <AiFieldsButton
                  subject={
                    kind === "qa"
                      ? "a clear question for a healthcare training Q&A"
                      : "a discussion topic for a healthcare training forum"
                  }
                  context={t ? `Working title: ${t}` : undefined}
                  fields={[
                    { key: "title", label: kind === "qa" ? "Question" : "Title", format: "text" },
                    { key: "body", label: "Detail", format: "text" },
                  ]}
                  onApply={(v) => {
                    if (v.title) setT(v.title)
                    if (v.body) setB(v.body)
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={
                  !t.trim() ||
                  create.isPending ||
                  (kind === "qa" && !!courses?.length && !courseId)
                }
              >
                {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data!.map((thread) => (
            <Link
              key={thread.id}
              to={`${basePath}/${thread.id}`}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand-navy/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              <div className="flex items-start gap-3">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="bg-brand-navy/10 text-xs font-semibold text-brand-navy">
                    {avatarInitials(thread.authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-brand-navy">
                    {thread.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {thread.authorName} ·{" "}
                    {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {kind === "qa" &&
                  (thread.is_resolved ? (
                    <Badge variant="secondary" className="gap-1 text-success">
                      <CheckCircle2 className="size-3" /> Answered
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Open</Badge>
                  ))}
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="size-3.5" /> {thread.replyCount}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
