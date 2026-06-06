import { supabase } from "@/lib/supabase/client"
import { docFile, esc, uploadToDrive } from "@/lib/courses/drive-export"
import type { QuestionType } from "@/types/database.types"

// ───────────────────────────────────────────────────────────────────────────
// AI generation of a complete course: details, curriculum (modules + lessons),
// an assessment (MCQs with answers), and three documents (Full Course, Learner
// Workbook, Trainer Workbook) saved to the Drive review folder and attached to
// the course. One call from the UI, persisted ready in the builder.
// ───────────────────────────────────────────────────────────────────────────

const GEN_SYSTEM = `You are a senior UK healthcare training developer and clinical education specialist for Vitalcare Training Hub.
You produce CSTF-aligned, CPD-accredited training that meets CQC and NHS mandatory training requirements.
Voice: authoritative, approachable, evidence-led, human. UK English only. Never use em-dashes; use commas or restructure.
Never use these words: delve, tapestry, testament, showcase, pivotal, synergy, seamless, leverage, holistic, world-class, transformative.
Return ONLY valid JSON matching the requested shape. No markdown fences, no commentary.`

export interface GenLesson {
  title: string
  content: string // HTML
}
export interface GenModule {
  title: string
  objectives: string[]
  keyPoints: string[]
  lessons: GenLesson[]
}
export interface GenQuestion {
  prompt: string
  options: { label: string; correct: boolean }[]
}
export interface GeneratedCourse {
  title: string
  summary: string
  description: string // HTML
  cpdHours: number
  durationMins: number
  cstf: boolean
  categoryName: string
  modules: GenModule[]
  assessment: { title: string; passMark: number; questions: GenQuestion[] }
}

type Progress = (step: string) => void

// ─── AI helpers ──────────────────────────────────────────────────────────────
function parseJson<T>(raw: string): T {
  let s = raw.trim()
  // Strip code fences if the model added them despite instructions.
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
  const first = s.indexOf("{")
  const last = s.lastIndexOf("}")
  if (first > 0 || last < s.length - 1) s = s.slice(first, last + 1)
  return JSON.parse(s) as T
}

async function aiJson<T>(prompt: string, maxTokens = 4096): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: { messages: [{ role: "user", content: prompt }], json: true, maxTokens, system: GEN_SYSTEM },
  })
  if (error) throw new Error("AI is unavailable. Check the ai-chat function and its API keys.")
  if (data?.error) throw new Error(data.error)
  return parseJson<T>(data.reply as string)
}

// ─── Generation pipeline ─────────────────────────────────────────────────────
interface Blueprint {
  summary: string
  description: string
  cpdHours: number
  durationMins: number
  cstf: boolean
  categoryName: string
  modules: { title: string; objectives: string[]; keyPoints: string[]; lessonTitles: string[] }[]
  assessment: { title: string; passMark: number }
}

export async function generateCourse(name: string, onProgress: Progress): Promise<GeneratedCourse> {
  onProgress("Designing the course outline")
  const bp = await aiJson<Blueprint>(
    `Design a UK healthcare training course titled "${name}".
Return JSON: {
 "summary": string (one line, max 200 chars),
 "description": string (2-3 short HTML paragraphs using <p> tags),
 "cpdHours": number, "durationMins": number, "cstf": boolean,
 "categoryName": string (the closest Vitalcare category, e.g. Mandatory Care, Safeguarding, Clinical Care, First Aid, Health and Safety Essentials),
 "modules": [ { "title": string, "objectives": [4 measurable CSTF-style outcomes], "keyPoints": [6 concise clinical facts], "lessonTitles": [3 lesson titles] } ] (4 to 6 modules),
 "assessment": { "title": "${name} Final Assessment", "passMark": 80 }
}`,
    4096,
  )

  const modules: GenModule[] = []
  for (let i = 0; i < bp.modules.length; i++) {
    const m = bp.modules[i]
    onProgress(`Writing lessons for module ${i + 1} of ${bp.modules.length}`)
    const filled = await aiJson<{ lessons: GenLesson[] }>(
      `Course: "${name}". Module: "${m.title}".
Write the lesson content for these lessons (keep the same titles and order): ${JSON.stringify(m.lessonTitles)}.
Each lesson is a 10-minute self-study unit. Return JSON: { "lessons": [ { "title": string, "content": string (200-300 words of HTML using <p>, <ul>, <li>, <strong>; UK clinical content, current guidance) } ] }`,
      4096,
    )
    modules.push({
      title: m.title,
      objectives: m.objectives ?? [],
      keyPoints: m.keyPoints ?? [],
      lessons: (filled.lessons ?? []).map((l) => ({ title: l.title, content: l.content || "" })),
    })
  }

  onProgress("Building the assessment")
  const qs = await aiJson<{ questions: GenQuestion[] }>(
    `Course: "${name}". Write 10 multiple-choice questions covering the whole course.
Return JSON: { "questions": [ { "prompt": string, "options": [ { "label": string, "correct": boolean } ] (4 options, exactly one correct) ] }`,
    4096,
  )

  return {
    title: name,
    summary: bp.summary ?? "",
    description: bp.description ?? "",
    cpdHours: Number(bp.cpdHours) || 0,
    durationMins: Number(bp.durationMins) || 0,
    cstf: bp.cstf ?? true,
    categoryName: bp.categoryName ?? "",
    modules,
    assessment: {
      title: bp.assessment?.title ?? `${name} Final Assessment`,
      passMark: Number(bp.assessment?.passMark) || 80,
      questions: (qs.questions ?? []).filter((q) => q.options?.some((o) => o.correct)),
    },
  }
}

// ─── Document builders ───────────────────────────────────────────────────────
function buildLearnerWorkbook(g: GeneratedCourse): File {
  let body = `<h1>${esc(g.title)}: Learner Workbook</h1>`
  body += `<p><strong>CSTF-aligned, CPD-accredited. Annual renewal required.</strong></p>`
  body += `<p>${esc(g.summary)}</p>`
  g.modules.forEach((m, i) => {
    body += `<h2>Section ${i + 1}: ${esc(m.title)}</h2>`
    if (m.objectives.length) {
      body += "<h3>By the end of this section you will be able to:</h3><ul>"
      body += m.objectives.map((o) => `<li>${esc(o)}</li>`).join("")
      body += "</ul>"
    }
    if (m.keyPoints.length) {
      body += "<h3>Key points</h3><ul>"
      body += m.keyPoints.map((k) => `<li>${esc(k)}</li>`).join("")
      body += "</ul>"
    }
  })
  body += "<h2>Final assessment</h2><ol>"
  g.assessment.questions.forEach((q) => {
    body += `<li>${esc(q.prompt)}<ul>`
    body += q.options.map((o) => `<li>${esc(o.label)}</li>`).join("")
    body += "</ul></li>"
  })
  body += "</ol>"
  body += `<p>Complete the online final assessment at vitalcare.uk to download your certificate.</p>`
  return docFile(`${g.title} - Learner Workbook`, body)
}

function buildTrainerWorkbook(g: GeneratedCourse): File {
  let body = `<h1>${esc(g.title)}: Trainer Workbook</h1>`
  body += `<p><strong>CONFIDENTIAL: FOR TRAINER USE ONLY. Contains full quiz answers. Do not distribute to learners.</strong></p>`
  body += `<p>Overseen by Harni Muharami RN MSc, Clinical Director.</p>`
  g.modules.forEach((m, i) => {
    body += `<h2>Section ${i + 1}: ${esc(m.title)}</h2>`
    if (m.objectives.length) {
      body += "<h3>Learning objectives</h3><ul>"
      body += m.objectives.map((o) => `<li>${esc(o)}</li>`).join("")
      body += "</ul>"
    }
    body += "<h3>Lessons</h3><ul>"
    body += m.lessons.map((l) => `<li>${esc(l.title)}</li>`).join("")
    body += "</ul>"
  })
  body += "<h2>Final assessment answer key</h2><ol>"
  g.assessment.questions.forEach((q) => {
    const correct = q.options.filter((o) => o.correct).map((o) => o.label).join("; ")
    body += `<li>${esc(q.prompt)} <strong>Answer: ${esc(correct)}</strong></li>`
  })
  body += "</ol>"
  return docFile(`${g.title} - Trainer Workbook`, body)
}

function buildFullCourse(g: GeneratedCourse): File {
  let body = `<h1>${esc(g.title)} - Full Course</h1>`
  if (g.summary) body += `<p><strong>${esc(g.summary)}</strong></p>`
  body += `<p>CPD hours: ${g.cpdHours} · Duration: ${g.durationMins} mins${g.cstf ? " · CSTF-aligned" : ""}</p>`
  if (g.description) body += `<div>${g.description}</div>`
  g.modules.forEach((m, mi) => {
    body += `<h2>Module ${mi + 1}: ${esc(m.title)}</h2>`
    m.lessons.forEach((l, li) => {
      body += `<h3>${mi + 1}.${li + 1} ${esc(l.title)}</h3>${l.content || ""}`
    })
  })
  return docFile(`${g.title} - Full Course`, body)
}

// ─── Persistence ─────────────────────────────────────────────────────────────
async function resolveCategoryId(name: string): Promise<string | null> {
  const { data } = await supabase.from("course_categories").select("id, name")
  const cats = (data ?? []) as { id: string; name: string }[]
  if (cats.length === 0) return null
  const lower = name.toLowerCase()
  const hit =
    cats.find((c) => c.name.toLowerCase() === lower) ??
    cats.find((c) => lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower))
  return (hit ?? cats[0]).id
}

async function uploadDoc(file: File): Promise<string | null> {
  // Prefer the Drive review folder; fall back to Supabase Storage so the
  // workbook always has a usable URL even when Drive is not connected.
  const drive = await uploadToDrive(file)
  if (drive.status === "ok" && drive.url) return drive.url
  const path = `materials/${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from("course-media").upload(path, file, { upsert: false })
  if (error) {
    console.error("[uploadDoc]", error)
    return null
  }
  return supabase.storage.from("course-media").getPublicUrl(path).data.publicUrl
}

/** Persist a generated course and everything attached. Returns the course id. */
export async function persistGeneratedCourse(
  g: GeneratedCourse,
  onProgress: Progress,
): Promise<string> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id ?? null

  onProgress("Creating the course")
  const categoryId = await resolveCategoryId(g.categoryName)
  const { data: course, error: cErr } = await supabase
    .from("courses")
    .insert({
      title: g.title,
      summary: g.summary || null,
      description: g.description || null,
      category_id: categoryId,
      is_cstf_aligned: g.cstf,
      cpd_hours: g.cpdHours,
      duration_mins: g.durationMins,
      is_published: false,
      created_by: uid,
    })
    .select("id")
    .single()
  if (cErr || !course) throw cErr ?? new Error("Could not create course")
  const courseId = course.id as string

  onProgress("Adding the curriculum")
  for (let mi = 0; mi < g.modules.length; mi++) {
    const m = g.modules[mi]
    const { data: mod, error: mErr } = await supabase
      .from("modules")
      .insert({ course_id: courseId, title: m.title, position: mi })
      .select("id")
      .single()
    if (mErr || !mod) throw mErr ?? new Error("Could not create module")
    if (m.lessons.length) {
      const { error: lErr } = await supabase.from("lessons").insert(
        m.lessons.map((l, li) => ({
          module_id: mod.id,
          title: l.title,
          type: "text" as const,
          content: l.content || null,
          duration_mins: 10,
          position: li,
        })),
      )
      if (lErr) throw lErr
    }
  }

  onProgress("Adding the assessment")
  const { data: assess, error: aErr } = await supabase
    .from("assessments")
    .insert({
      title: g.assessment.title,
      course_id: courseId,
      pass_mark: g.assessment.passMark,
      time_limit_mins: 25,
      max_attempts: 3,
      randomise: false,
      is_published: false,
      created_by: uid,
    })
    .select("id")
    .single()
  if (aErr || !assess) throw aErr ?? new Error("Could not create assessment")
  for (let qi = 0; qi < g.assessment.questions.length; qi++) {
    const q = g.assessment.questions[qi]
    const { data: question, error: qErr } = await supabase
      .from("questions")
      .insert({
        assessment_id: assess.id,
        type: "mcq" as QuestionType,
        prompt: q.prompt,
        points: 1,
        position: qi,
      })
      .select("id")
      .single()
    if (qErr || !question) throw qErr ?? new Error("Could not create question")
    const { error: oErr } = await supabase.from("question_options").insert(
      q.options.map((o, oi) => ({
        question_id: question.id,
        label: o.label,
        is_correct: o.correct,
        position: oi,
      })),
    )
    if (oErr) throw oErr
  }

  onProgress("Saving the workbooks and course files")
  const docs: { file: File; title: string; audience: "learner" | "trainer" | "both" }[] = [
    { file: buildFullCourse(g), title: `${g.title} - Full Course`, audience: "trainer" },
    { file: buildLearnerWorkbook(g), title: `${g.title} - Learner Workbook`, audience: "both" },
    { file: buildTrainerWorkbook(g), title: `${g.title} - Trainer Workbook`, audience: "trainer" },
  ]
  // course_resources is added in migration 034 and is not in the generated
  // Database type, so reach it through a minimal untyped builder (no `any`).
  const resourcesTable = () =>
    (
      supabase.from as unknown as (n: string) => {
        insert(v: object): PromiseLike<{ error: { message: string } | null }>
      }
    )("course_resources")
  for (const d of docs) {
    const url = await uploadDoc(d.file)
    if (!url) continue
    const { error: rErr } = await resourcesTable().insert({
      course_id: courseId,
      title: d.title,
      file_url: url,
      kind: "document",
      audience: d.audience,
      is_published: true,
      created_by: uid,
    })
    if (rErr) console.error("[persistGeneratedCourse:resource]", rErr)
  }

  return courseId
}

/** End to end: generate and persist. Returns the new course id. */
export async function generateAndPersistCourse(
  name: string,
  onProgress: Progress,
): Promise<string> {
  const generated = await generateCourse(name, onProgress)
  return persistGeneratedCourse(generated, onProgress)
}
