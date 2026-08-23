/**
 * Flatten stored rich text into a single line of plain text.
 *
 * Course descriptions and blog bodies are HTML. A meta description containing
 * markup is shown to a search engine with the tags in it, so anything bound for
 * <meta> has to be stripped first. Entities that survive stripping are decoded
 * so "&amp;" does not reach a title as literal text.
 */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
}

export function plainText(html: string | null | undefined): string {
  if (!html) return ""
  return html
    // Drop anything whose text content is not prose.
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    // A block boundary is a word boundary: without this "one</p><p>two"
    // becomes "onetwo".
    .replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim()
}
