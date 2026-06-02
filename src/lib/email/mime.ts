/**
 * Lightweight MIME parser for stored mail bodies.
 *
 * Some mail rows in mail_messages hold the FULL raw MIME source in body_html
 * (multipart boundaries, part headers, quoted-printable/base64 encoding). The
 * older sync path stored the raw source verbatim, so the inbox showed MIME
 * gibberish. This helper detects raw MIME, picks the best display part
 * (text/html, falling back to text/plain), strips part headers and decodes the
 * transfer encoding. Bodies that are already clean HTML or text pass straight
 * through untouched.
 *
 * No external dependency: the parser handles the common multipart layouts
 * produced by typical mail clients (multipart/alternative, multipart/mixed,
 * nested boundaries) well enough to recover readable content.
 */

export interface ParsedMail {
  html?: string
  text?: string
}

/** Does this string look like raw MIME source rather than clean HTML/text? */
export function looksLikeRawMime(raw: string): boolean {
  if (!raw) return false
  const head = raw.slice(0, 4000)
  // Boundary marker plus a part header is the strongest signal.
  const hasBoundaryMarker = /(^|\r?\n)--[^\r\n-][^\r\n]*\r?\n/.test(head)
  const hasContentType = /Content-Type:\s*(text\/|multipart\/|application\/)/i.test(
    head,
  )
  const hasTransferEncoding = /Content-Transfer-Encoding:\s*(quoted-printable|base64|7bit|8bit)/i.test(
    head,
  )
  // A leading "--boundary" plus a Content-Type header, or a multipart wrapper.
  if (hasBoundaryMarker && (hasContentType || hasTransferEncoding)) return true
  if (/Content-Type:\s*multipart\//i.test(head) && hasBoundaryMarker) return true
  return false
}

/** Decode a quoted-printable string (=XX hex escapes and soft line breaks). */
export function decodeQuotedPrintable(input: string): string {
  // Soft line breaks: "=" at end of line joins the next line.
  const joined = input.replace(/=\r?\n/g, "")
  // Decode =XX hex sequences as bytes, then UTF-8 decode the byte run so
  // multi-byte characters (e.g. curly quotes) survive intact.
  return joined.replace(/(?:=[0-9A-Fa-f]{2})+/g, (seq) => {
    const bytes: number[] = []
    for (let i = 0; i < seq.length; i += 3) {
      bytes.push(parseInt(seq.slice(i + 1, i + 3), 16))
    }
    try {
      return new TextDecoder("utf-8").decode(new Uint8Array(bytes))
    } catch {
      return seq
    }
  })
}

/** Decode a base64 part to a UTF-8 string. Tolerates whitespace/newlines. */
function decodeBase64(input: string): string {
  const clean = input.replace(/[^A-Za-z0-9+/=]/g, "")
  if (!clean) return ""
  try {
    const binary = atob(clean)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder("utf-8").decode(bytes)
  } catch {
    return ""
  }
}

interface MimePart {
  contentType: string
  encoding: string
  charset: string
  boundary: string | null
  body: string
}

/** Read the leading header block of a MIME part and return headers + body. */
function splitHeadersAndBody(section: string): { headers: string; body: string } {
  const sep = section.search(/\r?\n\r?\n/)
  if (sep < 0) return { headers: "", body: section }
  const match = section.slice(sep).match(/^\r?\n\r?\n/)
  const bodyStart = sep + (match ? match[0].length : 2)
  return { headers: section.slice(0, sep), body: section.slice(bodyStart) }
}

/** Pull a header value, unfolding continuation lines. */
function headerValue(headers: string, name: string): string {
  const re = new RegExp(`^${name}:\\s*([^\\r\\n]*(?:\\r?\\n[ \\t][^\\r\\n]*)*)`, "im")
  const m = headers.match(re)
  return m ? m[1].replace(/\r?\n[ \t]+/g, " ").trim() : ""
}

function parsePart(section: string): MimePart {
  const { headers, body } = splitHeadersAndBody(section)
  const contentTypeRaw = headerValue(headers, "Content-Type") || "text/plain"
  const contentType = contentTypeRaw.split(";")[0].trim().toLowerCase()
  const boundaryMatch = contentTypeRaw.match(/boundary="?([^";\r\n]+)"?/i)
  const charsetMatch = contentTypeRaw.match(/charset="?([^";\r\n]+)"?/i)
  const encoding = (headerValue(headers, "Content-Transfer-Encoding") || "7bit")
    .toLowerCase()
  return {
    contentType,
    encoding,
    charset: charsetMatch ? charsetMatch[1].toLowerCase() : "utf-8",
    boundary: boundaryMatch ? boundaryMatch[1].trim() : null,
    body,
  }
}

function decodePartBody(part: MimePart): string {
  if (part.encoding === "quoted-printable") return decodeQuotedPrintable(part.body)
  if (part.encoding === "base64") return decodeBase64(part.body)
  return part.body
}

/** Split a multipart body on its boundary into raw section strings. */
function splitOnBoundary(body: string, boundary: string): string[] {
  const marker = `--${boundary}`
  const segments = body.split(marker)
  const parts: string[] = []
  for (const seg of segments) {
    // Closing boundary is "--boundary--": skip the trailing terminator and any
    // preamble/epilogue (empty or "--" segments).
    const trimmed = seg.replace(/^\r?\n/, "")
    if (!trimmed || trimmed.startsWith("--")) continue
    parts.push(trimmed)
  }
  return parts
}

interface Collected {
  html?: string
  text?: string
}

/** Walk a MIME tree (depth-limited) collecting the first html and text parts. */
function collect(section: string, depth: number, out: Collected): void {
  if (depth > 8) return
  const part = parsePart(section)

  if (part.contentType.startsWith("multipart/") && part.boundary) {
    for (const child of splitOnBoundary(part.body, part.boundary)) {
      collect(child, depth + 1, out)
    }
    return
  }

  if (part.contentType === "text/html" && out.html === undefined) {
    out.html = decodePartBody(part)
    return
  }
  if (part.contentType === "text/plain" && out.text === undefined) {
    out.text = decodePartBody(part)
  }
}

/**
 * Parse a stored mail body. Returns the best display HTML and/or plain text.
 * Clean bodies pass through; raw MIME is decoded.
 */
export function parseMailBody(raw: string | null | undefined): ParsedMail {
  const value = (raw ?? "").trim()
  if (!value) return {}

  if (!looksLikeRawMime(value)) {
    // Already clean. Treat as HTML when it carries tags, otherwise plain text.
    return /<[a-z!/][\s\S]*>/i.test(value) ? { html: value } : { text: value }
  }

  // Raw MIME. The stored source may or may not include a top-level header block
  // before the first boundary; parsePart handles both since the Content-Type
  // header (if present) names the root boundary.
  const out: Collected = {}
  collect(value, 0, out)

  // If the tree walk found nothing usable (unusual layout), strip the obvious
  // MIME scaffolding so the user at least sees readable text rather than source.
  if (out.html === undefined && out.text === undefined) {
    out.text = stripMimeScaffolding(value)
  }
  return out
}

/** Last-resort cleanup: drop boundary lines and part headers, decode QP. */
function stripMimeScaffolding(raw: string): string {
  const withoutHeaders = raw
    .replace(/^--[^\r\n]*$/gm, "")
    .replace(/^Content-[^\r\n]*$/gim, "")
    .replace(/^MIME-Version:[^\r\n]*$/gim, "")
  return decodeQuotedPrintable(withoutHeaders).replace(/\n{3,}/g, "\n\n").trim()
}

/** HTML to readable plain text, for snippets and quoted replies. */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|div|br|li|tr|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/**
 * Best-effort plain-text view of a parsed mail, for snippets and quoting.
 * Prefers the decoded text part, else strips the HTML.
 */
export function mailPlainText(parsed: ParsedMail): string {
  if (parsed.text && parsed.text.trim()) return parsed.text.trim()
  if (parsed.html) return htmlToText(parsed.html)
  return ""
}

/**
 * A clean one-line snippet (no MIME headers/boundaries) for message-list rows.
 */
export function cleanSnippet(raw: string | null | undefined, max = 120): string {
  const text = mailPlainText(parseMailBody(raw))
  const collapsed = text.replace(/\s+/g, " ").trim()
  return collapsed.length > max ? `${collapsed.slice(0, max).trim()}…` : collapsed
}
