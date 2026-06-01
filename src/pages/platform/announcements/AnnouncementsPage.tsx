import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Megaphone, AlertCircle, Plus, Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useUser } from "@/hooks/use-user"
import {
  useAnnouncements,
  useCreateAnnouncement,
} from "@/lib/queries/communication.queries"
import AiAssistButton from "@/components/ai/AiAssistButton"

export default function AnnouncementsPage() {
  const { profile, isAdmin } = useUser()
  const { data, isLoading, isError, refetch } = useAnnouncements()
  const create = useCreateAnnouncement()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  function submit() {
    if (!title.trim() || !body.trim() || !profile?.id) return
    create
      .mutateAsync({ title, body, authorId: profile.id })
      .then(() => {
        toast.success("Announcement published")
        setTitle("")
        setBody("")
        setOpen(false)
      })
      .catch(() => toast.error("Could not publish. Please try again."))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Announcements</h1>
          <p className="mt-1 text-muted-foreground">
            Organisation-wide updates for your learners and trainers.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> New announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Write your announcement…"
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  <div className="mt-2">
                    <AiAssistButton
                      task="an organisation announcement for a healthcare training platform"
                      context={title ? `Title: ${title}` : undefined}
                      onInsert={(text) => setBody(text)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={submit}
                  disabled={!title.trim() || !body.trim() || create.isPending}
                >
                  {create.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Publish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load announcements. Please try again.
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
              <Megaphone className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No announcements yet.
              {isAdmin ? " Publish your first one above." : ""}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data!.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-xl">{a.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {a.authorName} ·{" "}
                  {format(
                    new Date(a.published_at ?? a.created_at),
                    "d MMM yyyy, HH:mm",
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {a.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
