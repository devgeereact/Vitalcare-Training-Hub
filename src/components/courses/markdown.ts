/**
 * Minimal, dependency-free Markdown to HTML converter for the course builder.
 *
 * The AI assistants return Markdown (H1/H2/H3, lists, bold, italic, links).
 * TipTap's StarterKit consumes HTML via setContent, so we translate the most
 * common Markdown blocks into the HTML the editor understands. This keeps
 * generated content as formatted blocks (headings, lists) rather than a flat
 * paragraph of plain text.
 *
 * Scope is deliberately narrow: headings, unordered/ordered lists, bold,
 * italic, inline code, links, and paragraphs. Anything else falls through as
 * a paragraph so no content is lost.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/** Inline formatting: bold, italic, inline code, links. Run after escaping. */
function inline(text: string): string {
  let out = text
  // Links [label](url) — restrict the URL to a safe character set.
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, label: string, url: string) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
  )
  // Bold (**x** or __x__)
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>")
  // Italic (*x* or _x_)
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
  out = out.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>")
  // Inline code
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>")
  return out
}

/** True when the string looks like Markdown rather than HTML or plain text. */
export function looksLikeMarkdown(text: string): boolean {
  if (/<\/?(p|h[1-6]|ul|ol|li|strong|em|div|br)\b/i.test(text)) return false
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s)/.test(text) || /\*\*|__|\[[^\]]+\]\(/.test(text)
}

/** Convert a Markdown string into HTML suitable for TipTap setContent. */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n")
  const html: string[] = []
  let listType: "ul" | "ol" | null = null
  let paragraph: string[] = []

  const flushParagraph = (): void => {
    if (paragraph.length) {
      html.push(`<p>${inline(escapeHtml(paragraph.join(" ")))}</p>`)
      paragraph = []
    }
  }
  const closeList = (): void => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.trim() === "") {
      flushParagraph()
      closeList()
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      closeList()
      const level = heading[1].length
      html.push(`<h${level}>${inline(escapeHtml(heading[2].trim()))}</h${level}>`)
      continue
    }

    const ordered = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ordered) {
      flushParagraph()
      if (listType !== "ol") {
        closeList()
        html.push("<ol>")
        listType = "ol"
      }
      html.push(`<li>${inline(escapeHtml(ordered[1].trim()))}</li>`)
      continue
    }

    const unordered = line.match(/^\s*[-*+]\s+(.*)$/)
    if (unordered) {
      flushParagraph()
      if (listType !== "ul") {
        closeList()
        html.push("<ul>")
        listType = "ul"
      }
      html.push(`<li>${inline(escapeHtml(unordered[1].trim()))}</li>`)
      continue
    }

    // Regular text — accumulate into the current paragraph.
    closeList()
    paragraph.push(line.trim())
  }

  flushParagraph()
  closeList()
  return html.join("")
}
