import { useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, HelpCircle, GitBranch } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useFaqs,
  useFaqMutations,
  usePrerequisites,
  usePrereqMutations,
} from "@/lib/queries/course-extras.queries"
import { useCourses } from "@/lib/queries/courses.queries"

export default function CourseExtrasEditor({ courseId }: { courseId: string }) {
  const faqs = useFaqs(courseId)
  const faqMut = useFaqMutations(courseId)
  const prereqs = usePrerequisites(courseId)
  const prereqMut = usePrereqMutations(courseId)
  const courses = useCourses()

  const [q, setQ] = useState("")
  const [a, setA] = useState("")
  const [prereq, setPrereq] = useState("")

  const existingPrereqIds = new Set((prereqs.data ?? []).map((p) => p.prerequisiteId))
  const prereqOptions = (courses.data ?? []).filter(
    (c) => c.id !== courseId && !existingPrereqIds.has(c.id),
  )

  return (
    <div className="space-y-6">
      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <HelpCircle className="size-5 text-brand-navy" /> FAQ
          </CardTitle>
          <CardDescription>Common questions shown on the course page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg border border-border p-3">
            <Input
              placeholder="Question"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Textarea
              rows={2}
              placeholder="Answer"
              value={a}
              onChange={(e) => setA(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={!q.trim() || !a.trim() || faqMut.add.isPending}
                onClick={() =>
                  faqMut.add
                    .mutateAsync({ question: q, answer: a, position: faqs.data?.length ?? 0 })
                    .then(() => {
                      toast.success("FAQ added")
                      setQ("")
                      setA("")
                    })
                    .catch(() => toast.error("Could not add"))
                }
              >
                {faqMut.add.isPending ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 size-4" />
                )}
                Add
              </Button>
            </div>
          </div>
          {(faqs.data?.length ?? 0) > 0 && (
            <ul className="divide-y divide-border">
              {faqs.data!.map((f) => (
                <li key={f.id} className="flex items-start gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{f.question}</p>
                    <p className="text-sm text-muted-foreground">{f.answer}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      faqMut.remove
                        .mutateAsync(f.id)
                        .catch(() => toast.error("Could not remove"))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <GitBranch className="size-5 text-brand-navy" /> Prerequisites
          </CardTitle>
          <CardDescription>
            Learners must complete these before they can enrol.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={prereq} onValueChange={setPrereq}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Choose a course…" />
              </SelectTrigger>
              <SelectContent>
                {prereqOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!prereq || prereqMut.add.isPending}
              onClick={() =>
                prereqMut.add
                  .mutateAsync(prereq)
                  .then(() => {
                    toast.success("Prerequisite added")
                    setPrereq("")
                  })
                  .catch(() => toast.error("Could not add"))
              }
            >
              <Plus className="mr-1.5 size-4" /> Add
            </Button>
          </div>
          {(prereqs.data?.length ?? 0) > 0 && (
            <ul className="divide-y divide-border">
              {prereqs.data!.map((p) => (
                <li key={p.id} className="flex items-center gap-2 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      prereqMut.remove
                        .mutateAsync(p.id)
                        .catch(() => toast.error("Could not remove"))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
