import { supabase } from "@/lib/supabase/client"
import { getQuestions } from "@/lib/queries/assessments.queries"
import type { CurriculumModule } from "@/lib/queries/courses.queries"
import type { Assessment, Course, QuestionOption } from "@/types/database.types"

// Saves admin-review copies of a course's generated artefacts to the connected
// Google Drive folder (the same folder MediaUpload uses, set by GDRIVE_FOLDER_ID
// on the drive-upload edge function). Workbooks are uploaded as files already,
// so they live in Drive from the moment they are added; this covers the Full
// Course and each Assessment, which otherwise exist only in the database.

export function esc(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c))
}

function safeName(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Document"
}

/** Wrap body HTML in a Word-openable .doc file. */
export function docFile(title: string, bodyHtml: string): File {
  const html =
    "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
    "xmlns:w='urn:schemas-microsoft-com:office:word'>" +
    `<head><meta charset='utf-8'><title>${esc(title)}</title></head>` +
    `<body style="font-family:Calibri,Arial,sans-serif;color:#0f172a">${bodyHtml}</body></html>`
  return new File([html], `${safeName(title)}.doc`, { type: "application/msword" })
}

function lessonBodyHtml(lesson: CurriculumModule["lessons"][number]): string {
  switch (lesson.type) {
    case "text":
      return lesson.content?.trim() || "<p><em>No content.</em></p>"
    case "video":
      return `<p>Video: ${esc(lesson.video_url || "—")}</p>`
    case "document":
      return `<p>Document: ${esc(lesson.document_url || "—")}</p>`
    case "scorm":
    case "h5p":
      return `<p>${lesson.type.toUpperCase()} package: ${esc(lesson.scorm_url || "—")}</p>`
    default:
      return ""
  }
}

export function buildCourseDoc(course: Course, modules: CurriculumModule[]): File {
  const title = `${course.title} - Full Course`
  let body = `<h1>${esc(course.title)}</h1>`
  if (course.summary) body += `<p><strong>${esc(course.summary)}</strong></p>`
  body +=
    `<p>CPD hours: ${course.cpd_hours} · Duration: ${course.duration_mins} mins` +
    `${course.is_cstf_aligned ? " · CSTF-aligned" : ""}</p>`
  if (course.description) body += `<div>${course.description}</div>`
  body += "<hr/>"
  modules.forEach((mod, mi) => {
    body += `<h2>Module ${mi + 1}: ${esc(mod.title)}</h2>`
    mod.lessons.forEach((lesson, li) => {
      body += `<h3>${mi + 1}.${li + 1} ${esc(lesson.title)} (${esc(lesson.type)})</h3>`
      body += lessonBodyHtml(lesson)
    })
  })
  return docFile(title, body)
}

function buildAssessmentDoc(
  course: Course,
  assessment: Assessment,
  questions: { prompt: string; points: number; options: QuestionOption[] }[],
): File {
  const title = `${course.title} - Assessment - ${assessment.title}`
  let body = `<h1>${esc(assessment.title)}</h1>`
  body += `<p>${esc(course.title)} · Pass mark ${assessment.pass_mark}%`
  if (assessment.time_limit_mins) body += ` · ${assessment.time_limit_mins} mins`
  body += " · Correct answers marked for admin review</p><hr/>"
  questions.forEach((q, i) => {
    body += `<p><strong>Q${i + 1}. ${esc(q.prompt)}</strong></p><ul>`
    for (const o of q.options) {
      body += `<li>${esc(o.label)}${o.is_correct ? " <strong>(correct)</strong>" : ""}</li>`
    }
    body += "</ul>"
  })
  return docFile(title, body)
}

export interface DriveUpload {
  status: "ok" | "notConfigured" | "failed"
  url?: string
}

export async function uploadToDrive(file: File): Promise<DriveUpload> {
  try {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("target", "review") // route to the dedicated course review folder
    const { data, error } = await supabase.functions.invoke("drive-upload", { body: fd })
    if (error) return { status: "failed" }
    if (data?.notConfigured) return { status: "notConfigured" }
    if (data?.url) return { status: "ok", url: data.url as string }
    return { status: "failed" }
  } catch (err) {
    console.error("[uploadToDrive]", err)
    return { status: "failed" }
  }
}

export interface DriveExportResult {
  uploaded: number
  failed: number
  notConfigured: boolean
}

/** Build and push the Full Course + every Assessment to the admin Drive folder. */
export async function exportCourseToDrive(
  course: Course,
  modules: CurriculumModule[],
): Promise<DriveExportResult> {
  const files: File[] = [buildCourseDoc(course, modules)]

  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("course_id", course.id)
    .is("deleted_at", null)
  for (const a of (assessments ?? []) as Assessment[]) {
    const qs = await getQuestions(a.id)
    files.push(buildAssessmentDoc(course, a, qs))
  }

  let uploaded = 0
  let failed = 0
  for (const file of files) {
    const r = await uploadToDrive(file)
    if (r.status === "notConfigured") return { uploaded, failed, notConfigured: true }
    if (r.status === "ok") uploaded += 1
    else failed += 1
  }
  return { uploaded, failed, notConfigured: false }
}
