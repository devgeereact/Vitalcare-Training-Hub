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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useThreads, useCreateThread } from "@/lib/queries/forums.queries"
import type { ForumThreadKind } from "@/types/database.types"

export default function ThreadBoard({
  kind,
  basePath,
  title,
  description,
  emptyText,
}: {
  kind: ForumThreadKind
  basePath: string
  title: string
  description: string
  emptyText: string
}) {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useThreads(kind)
  const create = useCreateThread()
  const [open, setOpen] = useState(false)
  const [t, setT] = useState("")
  const [b, setB] = useState("")
  const Icon = kind === "qa" ? HelpCircle : MessagesSquare

  function submit() {
    if (!t.trim() || !user?.id) return
    create
      .mutateAsync({ kind, title: t, body: b, authorId: user.id })
      .then(() => {
        toast.success(kind === "qa" ? "Question posted" : "Topic created")
        setT("")
        setB("")
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!t.trim() || create.isPending}>
                {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
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
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {data!.map((thread) => (
                <li key={thread.id}>
                  <Link
                    to={`${basePath}/${thread.id}`}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{thread.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {thread.authorName} ·{" "}
                        {formatDistanceToNow(new Date(thread.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {kind === "qa" && thread.is_resolved && (
                      <Badge variant="secondary" className="gap-1 text-success">
                        <CheckCircle2 className="size-3" /> Answered
                      </Badge>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="size-3.5" /> {thread.replyCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
