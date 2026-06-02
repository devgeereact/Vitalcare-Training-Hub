import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  HelpCircle,
  AlertCircle,
  Plus,
  Loader2,
  CheckCircle2,
  MessageSquare,
  BookOpen,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
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
import { useThreads, useCreateThread, type ThreadRow } from "@/lib/queries/forums.queries"
import { useCourses } from "@/lib/queries/courses.queries"
import AiFieldsButton from "@/components/ai/AiFieldsButton"

const BASE = "/platform/qa"

export default function QaWallPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useThreads("qa")
  const courses = useCourses()
  const create = useCreateThread()

  const [open, setOpen] = useState(false)
  const [courseId, setCourseId] = useState<string>("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  const courseName = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of courses.data ?? []) map.set(c.id, c.title)
    return map
  }, [courses.data])

  // Group questions by course (with an "Other" bucket for unscoped ones).
  const grouped = useMemo(() => {
    const groups = new Map<string, ThreadRow[]>()
    for (const t of data ?? []) {
      const key = t.course_id ?? "__none__"
      const list = groups.get(key) ?? []
      list.push(t)
      groups.set(key, list)
    }
    return [...groups.entries()].sort((a, b) => {
      if (a[0] === "__none__") return 1
      if (b[0] === "__none__") return -1
      return (courseName.get(b[0]) ?? "").localeCompare(courseName.get(a[0]) ?? "")
    })
  }, [data, courseName])

  function submit() {
    if (!title.trim() || !user?.id) return
    if (!courseId) {
      toast.error("Choose the course your question is about.")
      return
    }
    create
      .mutateAsync({ kind: "qa", title, body, authorId: user.id, courseId, basePath: BASE })
      .then(() => {
        toast.success("Question posted")
        setTitle("")
        setBody("")
        setCourseId("")
        setOpen(false)
      })
      .catch(() => toast.error("Could not post. Please try again."))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Q&amp;A</h1>
          <p className="mt-1 text-muted-foreground">
            Ask a question about a course. Trainers answer, and answers are marked for
            everyone to see.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" /> Ask a question
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ask a question</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block text-xs">Course</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Your question"
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
                  subject="a clear question for a healthcare training Q&A"
                  context={title ? `Working title: ${title}` : undefined}
                  fields={[
                    { key: "title", label: "Question", format: "text" },
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
              <Button onClick={submit} disabled={!title.trim() || !courseId || create.isPending}>
                {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Post question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load questions.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <HelpCircle className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No questions yet. Ask the first one above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([key, threads]) => (
            <section key={key} className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-brand-navy" />
                <h2 className="font-display text-lg text-foreground">
                  {key === "__none__" ? "General questions" : courseName.get(key) ?? "Course"}
                </h2>
                <Badge variant="secondary" className="ml-1">
                  {threads.length}
                </Badge>
              </div>
              <Card>
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {threads.map((t) => (
                      <li key={t.id}>
                        <Link
                          to={`${BASE}/${t.id}`}
                          className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                            <HelpCircle className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{t.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.authorName} ·{" "}
                              {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {t.is_resolved ? (
                            <Badge variant="secondary" className="gap-1 text-success">
                              <CheckCircle2 className="size-3" /> Answered
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Awaiting answer</Badge>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="size-3.5" /> {t.replyCount}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
