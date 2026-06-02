import mammoth from "mammoth"

export interface ParsedLesson {
  title: string
  content: string // HTML
}
export interface ParsedModule {
  title: string
  lessons: ParsedLesson[]
}

/**
 * Import convention:
 *   Module  = Heading 1  (.docx)  OR  "# Title"  (.txt/.md)
 *   Lesson  = Heading 2/3 (.docx) OR  "## Title" (.txt/.md)
 *   Body paragraphs attach to the current lesson (HTML preserved for .docx).
 * Body before the first lesson in a module becomes an "Overview" lesson.
 */
export async function parseImportFile(file: File): Promise<ParsedModule[]> {
  const name = file.name.toLowerCase()
  if (name.endsWith(".docx")) {
    const { value: html } = await mammoth.convertToHtml({
      arrayBuffer: await file.arrayBuffer(),
    })
    return parseHtml(html)
  }
  const text = await file.text()
  return parseText(text)
}

function parseHtml(html: string): ParsedModule[] {
  const doc = new DOMParser().parseFromString(html, "text/html")
  const modules: ParsedModule[] = []
  let mod: ParsedModule | null = null
  let lesson: ParsedLesson | null = null

  const pushBody = (htmlFragment: string) => {
    if (!htmlFragment.trim()) return
    if (!mod) mod = { title: "Module 1", lessons: [] }
    if (!lesson) {
      lesson = { title: "Overview", content: "" }
      mod.lessons.push(lesson)
    }
    lesson.content += htmlFragment
  }

  for (const el of Array.from(doc.body.children)) {
    const tag = el.tagName.toLowerCase()
    const txt = (el.textContent ?? "").trim()
    if (tag === "h1") {
      mod = { title: txt || "Untitled module", lessons: [] }
      modules.push(mod)
      lesson = null
    } else if (tag === "h2" || tag === "h3") {
      if (!mod) {
        mod = { title: "Module 1", lessons: [] }
        modules.push(mod)
      }
      lesson = { title: txt || "Untitled lesson", content: "" }
      mod.lessons.push(lesson)
    } else {
      pushBody(el.outerHTML)
    }
  }
  return modules.filter((m) => m.lessons.length > 0)
}

function parseText(text: string): ParsedModule[] {
  const modules: ParsedModule[] = []
  let mod: ParsedModule | null = null
  let lesson: ParsedLesson | null = null

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith("# ")) {
      mod = { title: line.slice(2).trim(), lessons: [] }
      modules.push(mod)
      lesson = null
    } else if (line.startsWith("## ") || line.startsWith("### ")) {
      if (!mod) {
        mod = { title: "Module 1", lessons: [] }
        modules.push(mod)
      }
      lesson = { title: line.replace(/^#+\s*/, "").trim(), content: "" }
      mod.lessons.push(lesson)
    } else {
      if (!mod) {
        mod = { title: "Module 1", lessons: [] }
        modules.push(mod)
      }
      if (!lesson) {
        lesson = { title: "Overview", content: "" }
        mod.lessons.push(lesson)
      }
      lesson.content += `<p>${escapeHtml(line)}</p>`
    }
  }
  return modules.filter((m) => m.lessons.length > 0)
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c))
}
