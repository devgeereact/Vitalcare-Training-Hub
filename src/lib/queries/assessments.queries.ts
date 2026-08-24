import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { issueCourseCertificate } from "@/lib/queries/certificates.queries"
import { callRpc } from "@/lib/supabase/rpc"
import type {
  Assessment,
  Question,
  QuestionOption,
  QuestionType,
} from "@/types/database.types"
import type {
  AssessmentFormValues,
  QuestionFormValues,
} from "@/lib/validations/assessment.schema"

export const assessmentsKeys = {
  all: ["assessments"] as const,
  list: () => [...assessmentsKeys.all, "list"] as const,
  detail: (id: string) => [...assessmentsKeys.all, "detail", id] as const,
  questions: (id: string) => [...assessmentsKeys.all, "questions", id] as const,
  results: (id: string | null) => [...assessmentsKeys.all, "results", id] as const,
  byCourse: (courseId: string) =>
    [...assessmentsKeys.all, "by-course", courseId] as const,
}

/** How many attempts the current learner has used on an assessment. */
export function useAttemptCount(assessmentId: string, enabled = true) {
  return useQuery({
    queryKey: [...assessmentsKeys.all, "attempt-count", assessmentId],
    enabled: enabled && !!assessmentId,
    queryFn: async (): Promise<number> => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return 0
      const { count } = await supabase
        .from("assessment_attempts")
        .select("id", { count: "exact", head: true })
        .eq("assessment_id", assessmentId)
        .eq("learner_id", auth.user.id)
      return count ?? 0
    },
  })
}

export interface CourseAssessment {
  id: string
  title: string
  passMark: number
  passed: boolean
}

/**
 * The published assessment linked to a course (if any), plus whether the
 * current learner has already passed it. Used on the course overview so a
 * learner can take the assessment that gates their certificate.
 */
export function useCourseAssessment(courseId: string | undefined) {
  return useQuery({
    queryKey: assessmentsKeys.byCourse(courseId ?? "none"),
    enabled: !!courseId,
    queryFn: async (): Promise<CourseAssessment | null> => {
      const { data, error } = await supabase
        .from("assessments")
        .select("id, title, pass_mark")
        .eq("course_id", courseId!)
        .eq("is_published", true)
        .limit(1)
        .maybeSingle()
      if (error) {
        console.error("[useCourseAssessment]", error)
        throw error
      }
      if (!data) return null

      const { data: auth } = await supabase.auth.getUser()
      let passed = false
      if (auth.user) {
        const { data: pass } = await supabase
          .from("assessment_attempts")
          .select("id")
          .eq("assessment_id", data.id)
          .eq("learner_id", auth.user.id)
          .eq("passed", true)
          .limit(1)
        passed = (pass?.length ?? 0) > 0
      }
      return {
        id: data.id,
        title: data.title,
        passMark: data.pass_mark,
        passed,
      }
    },
  })
}

// ─── List ────────────────────────────────────────────────────────────────────
export interface AssessmentRow {
  id: string
  title: string
  courseTitle: string
  passMark: number
  status: "Published" | "Draft"
  updatedAt: string
}

export async function getAssessments(): Promise<AssessmentRow[]> {
  const { data, error } = await supabase
    .from("assessments")
    .select("id, title, course_id, pass_mark, is_published, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
  if (error) {
    console.error("[getAssessments]", error)
    throw error
  }
  const courseIds = [...new Set((data ?? []).map((a) => a.course_id).filter(Boolean))]
  const { data: courses } = courseIds.length
    ? await supabase.from("courses").select("id, title").in("id", courseIds as string[])
    : { data: [] }
  const titleById = new Map((courses ?? []).map((c) => [c.id, c.title]))
  return (data ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    courseTitle: a.course_id ? titleById.get(a.course_id) ?? "-" : "Standalone",
    passMark: a.pass_mark,
    status: a.is_published ? "Published" : "Draft",
    updatedAt: a.updated_at,
  }))
}

export function useAssessments() {
  return useQuery({ queryKey: assessmentsKeys.list(), queryFn: getAssessments })
}

// ─── Detail + questions ──────────────────────────────────────────────────────
export async function getAssessment(id: string): Promise<Assessment> {
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .single()
  if (error) {
    console.error("[getAssessment]", error)
    throw error
  }
  return data as Assessment
}

export function useAssessment(id: string) {
  return useQuery({
    queryKey: assessmentsKeys.detail(id),
    queryFn: () => getAssessment(id),
    enabled: !!id,
  })
}

export interface QuestionWithOptions extends Question {
  options: QuestionOption[]
}

export async function getQuestions(assessmentId: string): Promise<QuestionWithOptions[]> {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .eq("assessment_id", assessmentId)
    .is("deleted_at", null)
    .order("position", { ascending: true })
  if (error) {
    console.error("[getQuestions]", error)
    throw error
  }
  if (!questions || questions.length === 0) return []
  // Options come through get_question_options (migration 068): it masks
  // is_correct for non-staff so learners cannot read the answer key, while the
  // staff Quiz Builder still sees the real answers.
  const { data: optRows, error: optErr } = await callRpc<
    { id: string; question_id: string; label: string; position: number; is_correct: boolean }[]
  >("get_question_options", { p_assessment: assessmentId })
  // A failed options fetch used to be logged and swallowed, which handed the
  // page a list of questions with no answers to choose from. The screen then
  // showed "this assessment has no questions yet", blaming the administrator
  // for a broken request. Fail loudly so the error state is reached instead.
  if (optErr) {
    console.error("[getQuestions:options]", optErr)
    throw optErr
  }
  const options = (optRows ?? []).map((o) => ({
    ...o,
    created_at: "",
    updated_at: "",
    deleted_at: null,
  })) as unknown as QuestionOption[]
  return (questions as Question[]).map((q) => ({
    ...q,
    options: options.filter((o) => o.question_id === q.id),
  }))
}

export function useQuestions(assessmentId: string) {
  return useQuery({
    queryKey: assessmentsKeys.questions(assessmentId),
    queryFn: () => getQuestions(assessmentId),
    enabled: !!assessmentId,
  })
}

// ─── Assessment mutations ────────────────────────────────────────────────────
function toRow(v: AssessmentFormValues) {
  return {
    title: v.title,
    description: v.description || null,
    course_id: v.course_id || null,
    pass_mark: v.pass_mark,
    time_limit_mins: v.time_limit_mins || null,
    max_attempts: v.max_attempts || null,
    randomise: v.randomise,
    is_published: v.is_published,
  }
}

export function useCreateAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: AssessmentFormValues): Promise<string> => {
      const { data: auth } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("assessments")
        .insert({ ...toRow(v), created_by: auth.user?.id ?? null })
        .select("id")
        .single()
      if (error) {
        console.error("[useCreateAssessment]", error)
        throw error
      }
      return data.id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: assessmentsKeys.list() }),
  })
}

export function useUpdateAssessment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: AssessmentFormValues) => {
      const { error } = await supabase.from("assessments").update(toRow(v)).eq("id", id)
      if (error) {
        console.error("[useUpdateAssessment]", error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assessmentsKeys.detail(id) })
      qc.invalidateQueries({ queryKey: assessmentsKeys.list() })
    },
  })
}

export function useDeleteAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("assessments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: assessmentsKeys.list() }),
  })
}

// ─── Question mutations ──────────────────────────────────────────────────────
export function useQuestionMutations(assessmentId: string) {
  const qc = useQueryClient()
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: assessmentsKeys.questions(assessmentId) })

  const saveQuestion = useMutation({
    mutationFn: async ({
      id,
      values,
      position,
    }: {
      id?: string
      values: QuestionFormValues
      position: number
    }) => {
      let questionId = id
      if (id) {
        const { error } = await supabase
          .from("questions")
          .update({ type: values.type as QuestionType, prompt: values.prompt, points: values.points })
          .eq("id", id)
        if (error) throw error
        // replace options
        await supabase.from("question_options").delete().eq("question_id", id)
      } else {
        const { data, error } = await supabase
          .from("questions")
          .insert({
            assessment_id: assessmentId,
            type: values.type as QuestionType,
            prompt: values.prompt,
            points: values.points,
            position,
          })
          .select("id")
          .single()
        if (error) throw error
        questionId = data.id
      }

      const opts =
        values.type === "true_false"
          ? values.options.length
            ? values.options
            : [
                { label: "True", is_correct: true },
                { label: "False", is_correct: false },
              ]
          : values.options
      if (opts.length > 0 && questionId) {
        const { error } = await supabase.from("question_options").insert(
          opts.map((o, i) => ({
            question_id: questionId!,
            label: o.label,
            is_correct: o.is_correct,
            position: i,
          })),
        )
        if (error) throw error
      }
    },
    onSuccess: invalidate,
  })

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("questions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { saveQuestion, deleteQuestion }
}

// ─── Review (questions + correct answers, after attempting) ──────────────────
export interface ReviewOption {
  id: string
  label: string
  isCorrect: boolean
  selected: boolean
}
export interface ReviewQuestion {
  id: string
  prompt: string
  type: string
  options: ReviewOption[]
}

interface ReviewRow {
  question_id: string
  prompt: string
  q_type: string
  option_id: string | null
  option_label: string | null
  is_correct: boolean | null
  selected: boolean | null
}

/**
 * Questions with the correct answers and the learner's own selections. The
 * get_assessment_review RPC (migration 084) only returns data to staff or to a
 * learner who has attempted the assessment, so the answer key stays hidden
 * during the quiz.
 */
export function useAssessmentReview(assessmentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["assessment", "review", assessmentId],
    enabled: enabled && !!assessmentId,
    queryFn: async (): Promise<ReviewQuestion[]> => {
      const { data, error } = await callRpc<ReviewRow[]>("get_assessment_review", {
        p_assessment: assessmentId,
      })
      if (error) {
        console.error("[useAssessmentReview]", error)
        throw error
      }
      const byQ = new Map<string, ReviewQuestion>()
      for (const r of data ?? []) {
        let q = byQ.get(r.question_id)
        if (!q) {
          q = { id: r.question_id, prompt: r.prompt, type: r.q_type, options: [] }
          byQ.set(r.question_id, q)
        }
        if (r.option_id) {
          q.options.push({
            id: r.option_id,
            label: r.option_label ?? "",
            isCorrect: Boolean(r.is_correct),
            selected: Boolean(r.selected),
          })
        }
      }
      return [...byQ.values()]
    },
  })
}

// ─── Take + auto-grade ───────────────────────────────────────────────────────
// Grading runs server-side in submit_assessment_attempt (migration 063), which
// is the only write path to assessment_attempts. get_question_options masks
// is_correct for anyone who is not staff (migration 068), so a learner cannot
// read the answer key or forge a score.
export interface SubmitAnswer {
  questionId: string
  selectedOptionIds: string[]
  textResponse: string
}

export interface AttemptResult {
  score: number
  passed: boolean
  autoGraded: boolean
}

/**
 * Submit an assessment attempt. Grading happens server-side in the
 * `submit_assessment_attempt` RPC (the only write path to assessment_attempts),
 * so the score and passed flag cannot be forged from the client.
 */
export async function submitAttempt(
  assessmentId: string,
  answers: Map<string, SubmitAnswer>,
  timeTakenSecs: number,
): Promise<AttemptResult> {
  const payload: Record<
    string,
    { selectedOptionIds: string[]; textResponse: string }
  > = {}
  for (const [qid, a] of answers) {
    payload[qid] = {
      selectedOptionIds: a.selectedOptionIds ?? [],
      textResponse: a.textResponse ?? "",
    }
  }

  const { data, error } = await callRpc<AttemptResult>("submit_assessment_attempt", {
    p_assessment: assessmentId,
    p_answers: payload,
    p_time_taken: timeTakenSecs,
  })
  if (error) {
    console.error("[submitAttempt]", error)
    throw new Error(error.message)
  }

  const result = data as AttemptResult
  // Passing the assessment is the last thing standing between the learner and
  // their certificate on a course that gates on one, so finish the course here.
  // Marking a lesson complete used to be the only path that issued anything,
  // which left a learner who finished the lessons first and passed the
  // assessment second with a course stuck in progress and no certificate.
  if (result.passed) {
    await completeCourseAfterAttempt(assessmentId)
  }
  return result
}

/**
 * Close out the course behind a passed assessment: issue the certificate (the
 * server re-checks every condition and is idempotent) and, once it has been
 * issued, mark the enrolment complete.
 */
async function completeCourseAfterAttempt(assessmentId: string): Promise<void> {
  const { data: assessment, error } = await supabase
    .from("assessments")
    .select("course_id")
    .eq("id", assessmentId)
    .single()
  if (error || !assessment?.course_id) {
    if (error) console.error("[completeCourseAfterAttempt]", error)
    return
  }

  // The attempt itself is already recorded and passed. If issuance fails now,
  // saying "could not submit" would be a lie about the thing that mattered, so
  // this step is logged and left for the course page to retry: issuance is
  // idempotent and runs again the next time the learner opens the course.
  let certId: string | null = null
  try {
    certId = await issueCourseCertificate(assessment.course_id)
  } catch (err) {
    console.error("[completeCourseAfterAttempt:issue]", err)
    return
  }
  if (!certId) return

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return
  const { error: enrolErr } = await supabase
    .from("enrollments")
    .update({
      status: "completed",
      progress_pct: 100,
      completed_at: new Date().toISOString(),
    })
    .eq("course_id", assessment.course_id)
    .eq("learner_id", auth.user.id)
  if (enrolErr) console.error("[completeCourseAfterAttempt:enrolment]", enrolErr)
}

// ─── Results / grade book ────────────────────────────────────────────────────
export interface ResultRow {
  id: string
  learnerName: string
  assessmentTitle: string
  score: number
  passed: boolean
  completedAt: string | null
}

export async function getResults(): Promise<ResultRow[]> {
  const { data, error } = await supabase
    .from("assessment_attempts")
    .select("id, assessment_id, learner_id, score, passed, completed_at")
    .order("completed_at", { ascending: false })
    .limit(500)
  if (error) {
    console.error("[getResults]", error)
    throw error
  }
  if (!data || data.length === 0) return []

  const learnerIds = [...new Set(data.map((d) => d.learner_id))]
  const assessmentIds = [...new Set(data.map((d) => d.assessment_id))]
  const [learners, assessments] = await Promise.all([
    supabase.from("profiles").select("id, full_name, first_name, last_name").in("id", learnerIds),
    supabase.from("assessments").select("id, title").in("id", assessmentIds),
  ])
  const nameById = new Map(
    (learners.data ?? []).map((p) => [
      p.id,
      p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
    ]),
  )
  const titleById = new Map((assessments.data ?? []).map((a) => [a.id, a.title]))

  return data.map((d) => ({
    id: d.id,
    learnerName: nameById.get(d.learner_id) ?? "Unknown",
    assessmentTitle: titleById.get(d.assessment_id) ?? "-",
    score: d.score,
    passed: d.passed,
    completedAt: d.completed_at,
  }))
}

export function useResults() {
  return useQuery({ queryKey: assessmentsKeys.results(null), queryFn: getResults })
}
