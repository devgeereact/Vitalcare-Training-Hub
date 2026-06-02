import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  MessagesSquare,
  AlertCircle,
  Plus,
  Loader2,
  MessageSquare,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { useThreads, useCreateThread } from "@/lib/queries/forums.queries"
import AiFieldsButton from "@/components/ai/AiFieldsButton"
import CommsShell from "@/components/communication/CommsShell"

const BASE = "/platform/forums"

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function ForumsPage(): ReactNode {
  const { user } = useAuth()
  const { isAdmin } = useUser()
  const { data, isLoading, isError, refetch } = useThreads("discussion")
  const create = useCreateThread()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  function submit(): void {
    if (!title.trim() || !user?.id) return
    create
      .mutateAsync({
        kind: "discussion",
        title,
        body,
        authorId: user.id,
        // Admin-posted discussions notify the whole hub.
        notifyEveryone: isAdmin,
        basePath: BASE,
      })
      .then(() => {
        toast.success("Topic created")
        setTitle("")
        setBody("")
        setOpen(false)
      })
      .catch(() => toast.error("Could not post. Please try again."))
  }

  const action = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" /> New topic
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New topic</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Topic title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Add some detail…"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex justify-end">
            <AiFieldsButton
              subject="a discussion topic for a healthcare training forum"
              context={title ? `Working title: ${title}` : undefined}
              fields={[
                { key: "title", label: "Title", format: "text" },
                { key: "body", label: "Detail", format: "text" },
              ]}
              onApply={(v) => {
                if (v.title) setTitle(v.title)
                if (v.body) setBody(v.body)
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!title.trim() || create.isPending}>
            {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return (
    <CommsShell
      subtitle="Course discussions for learners and trainers."
      action={action}
    >
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
              <MessagesSquare className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No topics yet. Start the first discussion above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data!.map((thread) => (
            <Card
              key={thread.id}
              className="transition-colors hover:border-brand-navy/30"
            >
              <Link
                to={`${BASE}/${thread.id}`}
                className="group block rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
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
                      {formatDistanceToNow(new Date(thread.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="size-3.5" /> {thread.replyCount}
                  </span>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </CommsShell>
  )
}
