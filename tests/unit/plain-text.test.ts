import { describe, expect, it } from "vitest"

import { plainText } from "@/lib/text/plain"

/**
 * Course descriptions and blog bodies are stored as HTML and are used verbatim
 * as meta descriptions. Markup reaching a <meta> tag is shown to a search
 * engine with the tags in it.
 */
describe("plainText", () => {
  it("strips tags", () => {
    expect(plainText("<p>Basic Life Support</p>")).toBe("Basic Life Support")
  })

  it("keeps a word boundary at a block edge", () => {
    expect(plainText("<p>one</p><p>two</p>")).toBe("one two")
  })

  it("drops script and style content entirely", () => {
    expect(plainText('<p>safe</p><script>alert("x")</script>')).toBe("safe")
    expect(plainText("<style>p{color:red}</style><p>safe</p>")).toBe("safe")
  })

  it("decodes the entities that matter", () => {
    expect(plainText("<p>Health &amp; Safety</p>")).toBe("Health & Safety")
    expect(plainText("<p>&quot;quoted&quot;</p>")).toBe('"quoted"')
  })

  it("collapses whitespace", () => {
    expect(plainText("<p>a</p>\n\n   <p>b</p>")).toBe("a b")
  })

  it("is safe on empty input", () => {
    expect(plainText(null)).toBe("")
    expect(plainText(undefined)).toBe("")
    expect(plainText("")).toBe("")
  })
})
