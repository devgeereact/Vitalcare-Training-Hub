import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { ACCOUNTS, PASSWORD } from "./helpers"

/**
 * Build the course a learner is going to sit, through the API, as an
 * administrator.
 *
 * The assertions in these specs are about the browser. Assembling a course,
 * two lessons, an assessment and its questions by clicking through the builder
 * would test the builder, take minutes, and break on every cosmetic change to
 * it. The builder has its own coverage; this is scaffolding.
 *
 * Everything is left unpublished so it cannot reach the public catalogue, and
 * every name carries a QA marker.
 */
export interface CourseFixture {
  courseId: string
  courseTitle: string
  productId: string
  lessonIds: string[]
  assessmentId: string
  /** questionId -> the option id that is correct */
  correct: Record<string, string>
  /** questionId -> an option id that is wrong */
  wrong: Record<string, string>
  /** The option labels, so the browser can click the right ones. */
  correctLabels: string[]
  wrongLabels: string[]
}

async function adminClient(): Promise<SupabaseClient> {
  const url = process.env.JOURNEY_SUPABASE_URL!
  const key = process.env.JOURNEY_SUPABASE_KEY!
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await client.auth.signInWithPassword({
    email: ACCOUNTS.admin,
    password: PASSWORD,
  })
  if (error) throw new Error(`Fixture sign-in failed: ${error.message}`)
  return client
}

/**
 * One course, one module, two lessons, one published assessment of two
 * multiple-choice questions, and a product that sells it.
 *
 * The pass mark is 100, so answering one question wrongly fails. That is what
 * makes the fail, retry, pass path testable at all.
 */
export async function createCourseFixture(): Promise<CourseFixture> {
  const admin = await adminClient()
  const stamp = Date.now().toString(36)
  const courseTitle = `QA rehearsal course ${stamp}`

  const { data: course, error: cErr } = await admin
    .from("courses")
    .insert({
      title: courseTitle,
      slug: `qa-rehearsal-${stamp}`,
      summary: "Fixture course for the operational rehearsal.",
      cpd_hours: 2,
      duration_mins: 30,
      renewal_months: 12,
      is_published: false,
    })
    .select("id")
    .single()
  if (cErr) throw cErr

  const { data: module, error: mErr } = await admin
    .from("modules")
    .insert({ course_id: course.id, title: "Module one", position: 0 })
    .select("id")
    .single()
  if (mErr) throw mErr

  const { data: lessons, error: lErr } = await admin
    .from("lessons")
    .insert([
      {
        module_id: module.id,
        title: "Lesson one",
        type: "text",
        content: "<p>Rehearsal content for lesson one.</p>",
        position: 0,
      },
      {
        module_id: module.id,
        title: "Lesson two",
        type: "text",
        content: "<p>Rehearsal content for lesson two.</p>",
        position: 1,
      },
    ])
    .select("id, position")
  if (lErr) throw lErr

  const { data: assessment, error: aErr } = await admin
    .from("assessments")
    .insert({
      course_id: course.id,
      title: `QA rehearsal assessment ${stamp}`,
      pass_mark: 100,
      max_attempts: 3,
      is_published: true,
    })
    .select("id")
    .single()
  if (aErr) throw aErr

  const { data: questions, error: qErr } = await admin
    .from("questions")
    .insert([
      {
        assessment_id: assessment.id,
        type: "mcq",
        prompt: "Which of these is the correct answer to question one?",
        points: 1,
        position: 0,
      },
      {
        assessment_id: assessment.id,
        type: "mcq",
        prompt: "Which of these is the correct answer to question two?",
        points: 1,
        position: 1,
      },
    ])
    .select("id, position")
  if (qErr) throw qErr
  const ordered = [...questions].sort((a, b) => a.position - b.position)

  const correct: Record<string, string> = {}
  const wrong: Record<string, string> = {}
  const correctLabels: string[] = []
  const wrongLabels: string[] = []

  for (const [index, q] of ordered.entries()) {
    const rightLabel = `Correct answer ${index + 1}`
    const wrongLabel = `Wrong answer ${index + 1}`
    const { data: options, error: oErr } = await admin
      .from("question_options")
      .insert([
        { question_id: q.id, label: rightLabel, is_correct: true, position: 0 },
        { question_id: q.id, label: wrongLabel, is_correct: false, position: 1 },
      ])
      .select("id, label")
    if (oErr) throw oErr
    correct[q.id] = options.find((o) => o.label === rightLabel)!.id
    wrong[q.id] = options.find((o) => o.label === wrongLabel)!.id
    correctLabels.push(rightLabel)
    wrongLabels.push(wrongLabel)
  }

  const { data: product, error: pErr } = await admin
    .from("products")
    .insert({
      name: `QA rehearsal place on ${courseTitle}`,
      description: "Fixture product for the operational rehearsal.",
      price_pence: 19_900,
      course_id: course.id,
      is_published: true,
    })
    .select("id")
    .single()
  if (pErr) throw pErr

  return {
    courseId: course.id,
    courseTitle,
    productId: product.id,
    lessonIds: [...lessons].sort((a, b) => a.position - b.position).map((l) => l.id),
    assessmentId: assessment.id,
    correct,
    wrong,
    correctLabels,
    wrongLabels,
  }
}

/** The verification code of the learner's certificate for a course, if any. */
export async function certificateFor(
  courseId: string,
): Promise<{ code: string; approved: boolean } | null> {
  const admin = await adminClient()
  const { data, error } = await admin
    .from("learner_certificates")
    .select("verification_code, approved")
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { code: data.verification_code as string, approved: data.approved as boolean }
}
