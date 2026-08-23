import { useMemo, useRef, useState } from "react"
import { useParams, Link, useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, XCircle, Check, X, ListChecks, Eye } from "lucide-react"

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
import { cn } from "@/lib/utils"
import {
  useAssessment,
  useQuestions,
  useAttemptCount,
  useAssessmentReview,
  submitAttempt,
  type SubmitAnswer,
  type AttemptResult,
  type QuestionWithOptions,
} from "@/lib/queries/assessments.queries"
import { useUser } from "@/hooks/use-user"
import { EmptyState, ErrorState, PermissionState } from "@/components/common/DataState"
import { isPermissionError } from "@/lib/queries/query-error"


/**
 * Grade an attempt in the browser, mirroring submit_assessment_attempt exactly:
 * multiple choice and true/false need the selected set to equal the correct
 * set, fill-in-the-blank matches any option label case-insensitively, and free
 * text is left for a trainer.
 *
 * Used ONLY by staff preview. A real attempt is always graded on the server,
 * where the answer key lives and the learner cannot see it.
 */
function gradeLocally(
  questions: QuestionWithOptions[],
  answers: Record<string, SubmitAnswer>,
  passMark: number,
): AttemptResult {
  let total = 0
  let earned = 0
  let hasEssay = false
  for (const q of questions) {
    total += q.points
    const given = answers[q.id]
    if (q.type === "free_text") {
      hasEssay = true
      continue
    }
    let correct = false
    if (q.type === "mcq" || q.type === "true_false") {
      const key = q.options.filter((o) => o.is_correct).map((o) => o.id).sort()
      const chosen = [...(given?.selectedOptionIds ?? [])].sort()
      correct =
        key.length > 0 &&
        key.length === chosen.length &&
        key.every((id, i) => id === chosen[i])
    } else {
      const text = (given?.textResponse ?? "").trim().toLowerCase()
      correct =
        text !== "" &&
        q.options.some((o) => o.label.trim().toLowerCase() === text)
    }
    if (correct) earned += q.points
  }
  const score = total > 0 ? Math.round((earned / total) * 100) : 0
  return { score, passed: score >= passMark, autoGraded: !hasEssay }
}

export default function TakeAssessmentPage() {
  const { id = "" } = useParams()
  const [searchParams] = useSearchParams()
  const { isAdmin, isTrainer } = useUser()
  const isStaff = isAdmin || isTrainer
  // Staff can walk the assessment exactly as a learner sees it, but nothing is
  // written: no attempt row, no score, no certificate, no notification, and no
  // attempt consumed. Anyone who is not staff gets the real thing, whatever the
  // query string says.
  const preview = isStaff && searchParams.get("preview") === "1"
  const qc = useQueryClient()
  const assessment = useAssessment(id)
  const questions = useQuestions(id)
  const attemptCount = useAttemptCount(id, !preview)
  const startedAt = useRef(Date.now())
  const [answers, setAnswers] = useState<Record<string, SubmitAnswer>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [showReview, setShowReview] = useState(false)
  const review = useAssessmentReview(id, showReview)

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
    if (preview) {
      // Score in the browser and stop. Nothing reaches the database, so no
      // attempt is recorded, no certificate is issued, no notification fires
      // and no learner reporting moves.
      setResult(gradeLocally(qs, answers, assessment.data.pass_mark))
      return
    }
    setSubmitting(true)
    try {
      const map = new Map(Object.entries(answers))
      const res = await submitAttempt(
        id,
        map,
        Math.round((Date.now() - startedAt.current) / 1000),
      )
      setResult(res)
      if (res.passed) {
        // A pass can complete the course and issue a certificate, so refresh
        // what the learner sees next.
        qc.invalidateQueries({ queryKey: ["certificates"] })
        qc.invalidateQueries({ queryKey: ["courses"] })
      }
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
    return isPermissionError(assessment.error) ? (
      <PermissionState className="mx-auto max-w-lg" resource="this assessment" />
    ) : (
      <ErrorState
        className="mx-auto max-w-lg"
        error={assessment.error}
        resource="this assessment"
        onRetry={assessment.refetch}
      />
    )
  }
  // A failed question load is a defect, not an empty assessment. Saying "no
  // questions yet" here would blame the administrator for a broken request.
  if (questions.isError) {
    return isPermissionError(questions.error) ? (
      <PermissionState className="mx-auto max-w-lg" resource="this assessment" />
    ) : (
      <ErrorState
        className="mx-auto max-w-lg"
        error={questions.error}
        resource="the questions for this assessment"
        onRetry={questions.refetch}
      />
    )
  }

  const maxAttempts = assessment.data?.max_attempts ?? 0
  const attemptsUsed = attemptCount.data ?? 0
  // Block a fresh attempt once the cap is reached (0 = unlimited).
  if (!preview && !result && maxAttempts > 0 && attemptsUsed >= maxAttempts) {
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
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => setShowReview(true)}>
                <ListChecks className="mr-1.5 size-4" /> Review answers
              </Button>
              <Button asChild variant="outline">
                <Link to="/platform/courses">Back to courses</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showReview && preview) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-2">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setShowReview(false)}>
          <ArrowLeft className="mr-1.5 size-4" /> Back
        </Button>
        <div>
          <h1 className="font-display text-3xl text-foreground">Answer key</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The correct answers are marked in green. Learners never see this view
            until they have used their attempts.
          </p>
        </div>
        {qs.map((q, i) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {i + 1}. {q.prompt}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {q.options.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Open response question, graded by a trainer.
                </p>
              ) : (
                q.options.map((o) => (
                  <div
                    key={o.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                      o.is_correct ? "border-success/40 bg-success/10" : "border-border",
                    )}
                  >
                    {o.is_correct ? (
                      <Check className="size-4 text-success" aria-label="Correct answer" />
                    ) : (
                      <span className="size-4" />
                    )}
                    {o.label}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (showReview) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-2">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setShowReview(false)}>
          <ArrowLeft className="mr-1.5 size-4" /> Back
        </Button>
        <div>
          <h1 className="font-display text-3xl text-foreground">Review answers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The correct answers are marked in green. Your selections are highlighted.
          </p>
        </div>
        {review.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : review.isError ? (
          isPermissionError(review.error) ? (
            <PermissionState resource="this review" />
          ) : (
            <ErrorState
              error={review.error}
              resource="your answers"
              onRetry={review.refetch}
            />
          )
        ) : (review.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Nothing to review yet"
            description="Your answers appear here once you have submitted an attempt."
          />
        ) : (
          review.data!.map((q, i) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {i + 1}. {q.prompt}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.options.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Open response question, graded by a trainer.
                  </p>
                ) : (
                  q.options.map((o) => (
                    <div
                      key={o.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm",
                        o.isCorrect
                          ? "border-success/40 bg-success/10"
                          : o.selected
                            ? "border-destructive/40 bg-destructive/10"
                            : "border-border",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {o.isCorrect ? (
                          <Check className="size-4 text-success" />
                        ) : o.selected ? (
                          <X className="size-4 text-destructive" />
                        ) : (
                          <span className="size-4" />
                        )}
                        {o.label}
                      </span>
                      {o.selected ? (
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          Your answer
                        </span>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))
        )}
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
            {preview && (
              <p className="rounded-md border border-brand-gold/40 bg-brand-gold/10 px-3 py-2 text-xs text-foreground">
                Preview result, scored in your browser. Nothing was saved.
              </p>
            )}
            {!result.autoGraded && (
              <p className="text-xs text-muted-foreground">
                Essay answers will be graded manually and may adjust your final mark.
              </p>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => setShowReview(true)}>
                <ListChecks className="mr-1.5 size-4" />
                {preview ? "Answer key" : "Review answers"}
              </Button>
              <Button asChild>
                <Link to={preview ? "/platform/assessments" : "/platform/courses"}>
                  {preview ? "Back to assessments" : "Back to courses"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to={preview ? "/platform/assessments" : "/platform/courses"}>
          <ArrowLeft className="mr-1.5 size-4" /> Exit
        </Link>
      </Button>

      {preview && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-gold/40 bg-brand-gold/10 px-4 py-3 text-sm"
        >
          <Eye className="size-5 shrink-0 text-brand-gold" aria-hidden="true" />
          <p className="text-foreground">
            <strong className="font-semibold">Preview.</strong> You are seeing the
            assessment exactly as a learner does. Nothing is recorded: no attempt,
            no result, no certificate and no notification.
          </p>
        </div>
      )}

      <div>
        <h1 className="font-display text-3xl text-foreground">{assessment.data!.title}</h1>
        {assessment.data!.description && (
          <p className="mt-1 text-muted-foreground">{assessment.data!.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Pass mark {assessment.data!.pass_mark}% · {qs.length} question{qs.length === 1 ? "" : "s"}
        </p>
        {(preview || attemptsUsed > 0) && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setShowReview(true)}
          >
            <ListChecks className="mr-1.5 size-4" />
            {preview ? "Answer key" : "Review previous answers"}
          </Button>
        )}
      </div>

      {qs.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="This assessment has no questions yet"
          description={
            isStaff
              ? "Add questions in the quiz builder before publishing it to learners."
              : "Your trainer is still building it. Check back shortly."
          }
          action={
            isStaff ? (
              <Button asChild variant="outline" size="sm">
                <Link to={`/platform/assessments/builder/${id}`}>Open the builder</Link>
              </Button>
            ) : undefined
          }
        />
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
