import { useState } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  MessagesSquare,
  HelpCircle,
  Plus,
  Loader2,
  MessageSquare,
  CheckCircle2,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useThreads, useCreateThread } from "@/lib/queries/forums.queries"
import type { ForumThreadKind } from "@/types/database.types"

export default function CourseDiscussion({ courseId }: { courseId: string }) {
  const { user } = useAuth()
  const [kind, setKind] = useState<ForumThreadKind>("discussion")
  const { data, isLoading } = useThreads(kind, courseId)
  const create = useCreateThread()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  const basePath = kind === "qa" ? "/platform/qa" : "/platform/forums"

  function submit() {
    if (!title.trim() || !user?.id) return
    create
      .mutateAsync({ kind, title, body, courseId, authorId: user.id })
      .then(() => {
        toast.success(kind === "qa" ? "Question posted" : "Topic created")
        setTitle("")
        setBody("")
        setAdding(false)
      })
      .catch(() => toast.error("Could not post. Please try again."))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Discussion</CardTitle>
        <div className="flex rounded-lg border border-border p-0.5">
          {(["discussion", "qa"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                kind === k
                  ? "bg-brand-navy text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {k === "qa" ? (
                <HelpCircle className="size-3.5" />
              ) : (
                <MessagesSquare className="size-3.5" />
              )}
              {k === "qa" ? "Q&A" : "Topics"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {adding ? (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <Input
              placeholder={kind === "qa" ? "Your question" : "Topic title"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              rows={3}
              placeholder="Add detail…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submit} disabled={!title.trim() || create.isPending}>
                {create.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                Post
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 size-4" />
            {kind === "qa" ? "Ask a question" : "New topic"}
          </Button>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {kind === "qa"
              ? "No questions yet. Ask the first one."
              : "No topics yet. Start the discussion."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data!.map((t) => (
              <li key={t.id}>
                <Link
                  to={`${basePath}/${t.id}`}
                  className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.authorName} ·{" "}
                      {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {kind === "qa" && t.is_resolved && (
                    <Badge variant="secondary" className="gap-1 text-success">
                      <CheckCircle2 className="size-3" /> Answered
                    </Badge>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="size-3.5" /> {t.replyCount}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
