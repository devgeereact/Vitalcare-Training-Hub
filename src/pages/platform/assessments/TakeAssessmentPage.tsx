import { useMemo, useRef, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, AlertCircle, CheckCircle2, XCircle } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAssessment,
  useQuestions,
  useAttemptCount,
  submitAttempt,
  type SubmitAnswer,
  type AttemptResult,
} from "@/lib/queries/assessments.queries"

export default function TakeAssessmentPage() {
  const { id = "" } = useParams()
  const assessment = useAssessment(id)
  const questions = useQuestions(id)
  const attemptCount = useAttemptCount(id)
  const startedAt = useRef(Date.now())
  const [answers, setAnswers] = useState<Record<string, SubmitAnswer>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AttemptResult | null>(null)

  const qs = useMemo(() => questions.data ?? [], [questions.data])

  function setOption(qId: string, optionId: string, multi: boolean, checked: boolean) {
    setAnswers((prev) => {
      const cur = prev[qId]?.selectedOptionIds ?? []
      const next = multi
        ? checked
          ? [...cur, optionId]
          : cur.filter((x) => x !== optionId)
        : [optionId]
      return { ...prev, [qId]: { questionId: qId, selectedOptionIds: next, textResponse: prev[qId]?.textResponse ?? "" } }
    })
  }
  function setText(qId: string, text: string) {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { questionId: qId, selectedOptionIds: prev[qId]?.selectedOptionIds ?? [], textResponse: text },
    }))
  }

  async function handleSubmit() {
    if (!assessment.data) return
    setSubmitting(true)
    try {
      const map = new Map(Object.entries(answers))
      const res = await submitAttempt(
        id,
        assessment.data.pass_mark,
        qs,
        map,
        Math.round((Date.now() - startedAt.current) / 1000),
      )
      setResult(res)
    } catch {
      toast.error("Could not submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (assessment.isLoading || questions.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (assessment.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Could not load this assessment.</p>
        <Button variant="outline" size="sm" onClick={() => assessment.refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const maxAttempts = assessment.data?.max_attempts ?? 0
  const attemptsUsed = attemptCount.data ?? 0
  // Block a fresh attempt once the cap is reached (0 = unlimited).
  if (!result && maxAttempts > 0 && attemptsUsed >= maxAttempts) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <XCircle className="size-12 text-muted-foreground" />
            <h1 className="font-display text-2xl text-foreground">
              No attempts left
            </h1>
            <p className="text-sm text-muted-foreground">
              You have used all {maxAttempts} attempt
              {maxAttempts === 1 ? "" : "s"} for this assessment.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/platform/courses">Back to courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            {result.passed ? (
              <CheckCircle2 className="size-14 text-success" />
            ) : (
              <XCircle className="size-14 text-destructive" />
            )}
            <h1 className="font-display text-3xl text-foreground">{result.score}%</h1>
            <p className="text-muted-foreground">
              {result.passed ? "Passed" : "Not passed"} · pass mark {assessment.data!.pass_mark}%
            </p>
            {!result.autoGraded && (
              <p className="text-xs text-muted-foreground">
                Essay answers will be graded manually and may adjust your final mark.
              </p>
            )}
            <Button asChild className="mt-2">
              <Link to="/platform/courses">Back to courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/platform/courses">
          <ArrowLeft className="mr-1.5 size-4" /> Exit
        </Link>
      </Button>

      <div>
        <h1 className="font-display text-3xl text-foreground">{assessment.data!.title}</h1>
        {assessment.data!.description && (
          <p className="mt-1 text-muted-foreground">{assessment.data!.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Pass mark {assessment.data!.pass_mark}% · {qs.length} question{qs.length === 1 ? "" : "s"}
        </p>
      </div>

      {qs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            This assessment has no questions yet.
          </CardContent>
        </Card>
      ) : (
        <>
          {qs.map((q, i) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {i + 1}. {q.prompt}
                </CardTitle>
                <CardDescription>{q.points} point{q.points === 1 ? "" : "s"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(q.type === "mcq" || q.type === "true_false") &&
                  q.options.map((o) => {
                    const multi = q.type === "mcq"
                    const checked = (answers[q.id]?.selectedOptionIds ?? []).includes(o.id)
                    return (
                      <label
                        key={o.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => setOption(q.id, o.id, multi, !!c)}
                        />
                        <span className="text-sm">{o.label}</span>
                      </label>
                    )
                  })}
                {q.type === "fill_blank" && (
                  <Input
                    placeholder="Your answer"
                    value={answers[q.id]?.textResponse ?? ""}
                    onChange={(e) => setText(q.id, e.target.value)}
                  />
                )}
                {q.type === "free_text" && (
                  <Textarea
                    rows={4}
                    placeholder="Your answer"
                    value={answers[q.id]?.textResponse ?? ""}
                    onChange={(e) => setText(q.id, e.target.value)}
                  />
                )}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit assessment"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
