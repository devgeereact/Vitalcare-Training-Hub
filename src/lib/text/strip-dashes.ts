/**
 * Remove em dashes and en dashes from user-facing copy. The brand rule is no
 * dashes anywhere, so this runs on content as it is saved, whatever the source
 * (AI, typed, or pasted). Em dashes become a comma; en dashes become a comma, or
 * "to" for number ranges; stray artefacts are tidied.
 *
 * Mirrors stripDashes() in the ai-chat edge function so AI output and saved
 * content follow the same house style.
 */
export function stripDashes(text: string): string {
  if (!text) return text
  return text
    // Number ranges: 100–120 or 100—120 -> 100 to 120
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1 to $2")
    // Em dash, any spacing -> comma + space
    .replace(/\s*—\s*/g, ", ")
    // En dash used as a separator or bullet -> comma + space
    .replace(/\s*–\s*/g, ", ")
    // Tidy artefacts created by the swaps
    .replace(/:\s*,\s*/g, ": ")
    .replace(/,\s*,/g, ",")
    .replace(/\s+,/g, ",")
    .replace(/[ \t]{2,}/g, " ")
}

/** Apply stripDashes to a value only when it is a non-empty string. */
export function stripDashesMaybe<T extends string | null | undefined>(value: T): T {
  return (typeof value === "string" ? stripDashes(value) : value) as T
}
