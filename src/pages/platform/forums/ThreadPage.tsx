import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  ArrowLeft,
  AlertCircle,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { useThreadDetail, useReply } from "@/lib/queries/forums.queries"

export default function ThreadPage() {
  const { id = "" } = useParams()
  const { user } = useAuth()
  const { isAdmin, isTrainer } = useUser()
  const { data, isLoading, isError, refetch } = useThreadDetail(id)
  const reply = useReply(id)
  const [body, setBody] = useState("")

  const isQa = data?.thread.kind === "qa"
  const canAnswer = isAdmin || isTrainer
  const backPath = isQa ? "/platform/qa" : "/platform/forums"

  function send(asAnswer: boolean) {
    if (!body.trim() || !user?.id) return
    reply
      .mutateAsync({ body, authorId: user.id, isAnswer: asAnswer })
      .then(() => {
        setBody("")
        toast.success(asAnswer ? "Answer posted" : "Reply posted")
      })
      .catch(() => toast.error("Could not post. Please try again."))
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Could not load this thread.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to={backPath}>
          <ArrowLeft className="mr-1.5 size-4" /> Back
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="font-display text-2xl">{data.thread.title}</CardTitle>
            {isQa && (
              <Badge
                variant="secondary"
                className={data.thread.is_resolved ? "gap-1 text-success" : ""}
              >
                {data.thread.is_resolved ? (
                  <>
                    <CheckCircle2 className="size-3" /> Answered
                  </>
                ) : (
                  "Open"
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No replies yet.</p>
          ) : (
            <ul className="space-y-4">
              {data.posts.map((p) => (
                <li
                  key={p.id}
                  className={cn(
                    "rounded-lg border p-3",
                    p.is_answer
                      ? "border-success/40 bg-success/5"
                      : "border-border",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">{p.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(p.created_at), "d MMM yyyy, HH:mm")}
                    </span>
                  </div>
                  {p.is_answer && (
                    <Badge variant="secondary" className="mb-1.5 gap-1 text-success">
                      <CheckCircle2 className="size-3" /> Answer
                    </Badge>
                  )}
                  <p className="whitespace-pre-wrap text-sm">{p.body}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 border-t border-border pt-4">
            <Textarea
              placeholder="Write a reply…"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              {isQa && canAnswer && (
                <Button
                  variant="outline"
                  onClick={() => send(true)}
                  disabled={!body.trim() || reply.isPending}
                >
                  <CheckCircle2 className="mr-1.5 size-4" /> Post as answer
                </Button>
              )}
              <Button onClick={() => send(false)} disabled={!body.trim() || reply.isPending}>
                {reply.isPending ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 size-4" />
                )}
                Reply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
