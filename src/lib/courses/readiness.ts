import type { Lesson } from "@/types/database.types"
import type { CurriculumModule } from "@/lib/queries/courses.queries"

/** A lesson is complete when its type's required content field is filled. */
export function lessonComplete(lesson: Lesson): boolean {
  switch (lesson.type) {
    case "text":
      return !!lesson.content?.trim()
    case "video":
      return !!lesson.video_url?.trim()
    case "document":
      return !!lesson.document_url?.trim()
    case "scorm":
    case "h5p":
      return !!lesson.scorm_url?.trim()
    default:
      return true
  }
}

export interface CurriculumReadiness {
  totalLessons: number
  emptyModules: number
  incompleteLessons: number
  /** emptyModules + incompleteLessons. Zero means publish-ready. */
  issues: number
  ready: boolean
  /** Human-readable problem fragments, e.g. "2 modules with no lessons". */
  parts: string[]
}

/** Roll a curriculum up into a publish-readiness summary. */
export function curriculumReadiness(modules: CurriculumModule[]): CurriculumReadiness {
  const emptyModules = modules.filter((mod) => mod.lessons.length === 0).length
  const incompleteLessons = modules.reduce(
    (n, mod) => n + mod.lessons.filter((l) => !lessonComplete(l)).length,
    0,
  )
  const totalLessons = modules.reduce((n, mod) => n + mod.lessons.length, 0)
  const issues = emptyModules + incompleteLessons
  const parts: string[] = []
  if (modules.length === 0) parts.push("no modules yet")
  if (emptyModules > 0)
    parts.push(`${emptyModules} module${emptyModules > 1 ? "s" : ""} with no lessons`)
  if (incompleteLessons > 0)
    parts.push(`${incompleteLessons} lesson${incompleteLessons > 1 ? "s" : ""} missing content`)
  return {
    totalLessons,
    emptyModules,
    incompleteLessons,
    issues,
    ready: issues === 0 && modules.length > 0,
    parts,
  }
}
