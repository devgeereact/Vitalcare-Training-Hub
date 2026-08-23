import type {
  AttemptResult,
  QuestionWithOptions,
  SubmitAnswer,
} from "@/lib/queries/assessments.queries"

/**
 * Grade an attempt in the browser, mirroring submit_assessment_attempt exactly:
 * multiple choice and true/false need the selected set to equal the correct
 * set, fill-in-the-blank matches any option label case-insensitively, and free
 * text is left for a trainer.
 *
 * Used ONLY by staff preview. A real attempt is always graded on the server,
 * where the answer key lives and the learner cannot see it.
 */
export function gradeLocally(
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
