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
  if (name.endsWith(".xml")) {
    return parseXml(await file.text())
  }
  const text = await file.text()
  return parseText(text)
}

// ─── XML ──────────────────────────────────────────────────────────────────────
/**
 * Two XML shapes are supported:
 *   1. WordPress / LearnPress export (WXR): an <rss> feed of <item> elements,
 *      each with a <wp:post_type>. lp_lesson / lp_topic items become lessons.
 *   2. Generic nested XML: <module>/<section> elements containing
 *      <lesson>/<item>/<topic> children, with titles in a "title" attribute or
 *      a child <title>/<name> element.
 */
function parseXml(xml: string): ParsedModule[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml")
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Invalid XML file")
  }
  const items = Array.from(doc.getElementsByTagName("item"))
  if (items.length > 0) {
    const wxr = parseWxr(items)
    if (wxr.length > 0) return wxr
  }
  return parseGenericXml(doc)
}

function firstText(el: Element, ...tags: string[]): string {
  for (const tag of tags) {
    const node = el.getElementsByTagName(tag)[0]
    if (node?.textContent != null) return node.textContent.trim()
  }
  return ""
}

const LESSON_POST_TYPES = new Set(["lp_lesson", "lp_topic", "lesson", "topic"])

function parseWxr(items: Element[]): ParsedModule[] {
  // The course title, if present, names the single imported module. LearnPress
  // section grouping lives in serialized post meta that is not reliably present
  // in the export, so lessons are collected in document order under one module.
  let courseTitle = "Imported lessons"
  const lessons: ParsedLesson[] = []

  for (const item of items) {
    const postType = firstText(item, "wp:post_type")
    const title = firstText(item, "title")
    if (postType === "lp_course" && title) {
      courseTitle = title
      continue
    }
    if (!LESSON_POST_TYPES.has(postType)) continue
    if (!title) continue
    const content = firstText(item, "content:encoded")
    lessons.push({
      title,
      content: content ? wrapPlain(content) : "",
    })
  }

  if (lessons.length === 0) return []
  return [{ title: courseTitle, lessons }]
}

function parseGenericXml(doc: Document): ParsedModule[] {
  const containers = [
    ...Array.from(doc.getElementsByTagName("module")),
    ...Array.from(doc.getElementsByTagName("section")),
  ]
  const childLessons = (parent: Element): ParsedLesson[] => {
    const out: ParsedLesson[] = []
    for (const tag of ["lesson", "item", "topic"]) {
      for (const el of Array.from(parent.getElementsByTagName(tag))) {
        const title =
          el.getAttribute("title")?.trim() || firstText(el, "title", "name")
        if (!title) continue
        const content = firstText(el, "content", "body") || textOnly(el)
        out.push({ title, content: content ? wrapPlain(content) : "" })
      }
    }
    return out
  }

  if (containers.length > 0) {
    const modules = containers.map((c) => ({
      title: c.getAttribute("title")?.trim() || firstText(c, "title", "name") || "Module",
      lessons: childLessons(c),
    }))
    return modules.filter((m) => m.lessons.length > 0)
  }

  // No module/section wrappers: gather any lesson-like elements into one module.
  const flat = childLessons(doc.documentElement)
  return flat.length > 0 ? [{ title: "Imported lessons", lessons: flat }] : []
}

/** Direct text of an element, excluding nested element markup. */
function textOnly(el: Element): string {
  let s = ""
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3) s += node.textContent ?? "" // text node
  }
  return s.trim()
}

/** Wrap raw text as paragraphs; pass through anything that already has tags. */
function wrapPlain(s: string): string {
  const trimmed = s.trim()
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed
  return trimmed
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p.replace(/\n/g, " ").trim())}</p>`)
    .join("")
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
