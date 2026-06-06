import DOMPurify from "dompurify"

// Single place to sanitise rich-text/HTML before rendering with
// dangerouslySetInnerHTML. Course descriptions and lesson content are authored
// (or AI-generated) and stored as HTML, so they must be cleaned at render time
// to prevent stored XSS. Allow the formatting tags the editor and the AI
// generator emit; strip scripts, event handlers, iframes, and dangerous URLs.
const ALLOWED_TAGS = [
  "p", "br", "hr", "span", "div",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
  "ul", "ol", "li",
  "blockquote", "code", "pre",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
]
const ALLOWED_ATTR = ["href", "title", "target", "rel", "src", "alt", "width", "height"]

/** Clean untrusted HTML for safe rendering. Returns a sanitised HTML string. */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ""
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Block javascript:, data: (except images handled by the tag list), etc.
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/|#)/i,
    ADD_ATTR: ["target"],
  })
}
