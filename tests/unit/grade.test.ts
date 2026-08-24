import { describe, expect, it } from "vitest"

import { gradeLocally } from "@/lib/assessments/grade"
import type {
  QuestionWithOptions,
  SubmitAnswer,
} from "@/lib/queries/assessments.queries"

/**
 * Staff preview scores in the browser so nothing is written. That is only
 * defensible if it produces the same result the server would, otherwise a
 * trainer signs off an assessment that behaves differently for learners.
 *
 * These cases mirror submit_assessment_attempt (migration 063) rule for rule.
 */
function question(
  partial: Partial<QuestionWithOptions> & Pick<QuestionWithOptions, "id" | "type">,
): QuestionWithOptions {
  return {
    points: 1,
    prompt: "",
    position: 0,
    assessment_id: "a",
    created_at: "",
    updated_at: "",
    deleted_at: null,
    options: [],
    ...partial,
  } as QuestionWithOptions
}

function option(id: string, label: string, isCorrect: boolean) {
  return {
    id,
    question_id: "q",
    label,
    position: 0,
    is_correct: isCorrect,
    created_at: "",
    updated_at: "",
    deleted_at: null,
  } as QuestionWithOptions["options"][number]
}

function answer(questionId: string, selected: string[] = [], text = ""): SubmitAnswer {
  return { questionId, selectedOptionIds: selected, textResponse: text }
}

describe("gradeLocally", () => {
  it("scores a single-answer question", () => {
    const qs = [
      question({
        id: "q",
        type: "true_false",
        points: 1,
        options: [option("yes", "True", true), option("no", "False", false)],
      }),
    ]
    expect(gradeLocally(qs, { q: answer("q", ["yes"]) }, 50).score).toBe(100)
    expect(gradeLocally(qs, { q: answer("q", ["no"]) }, 50).score).toBe(0)
  })

  it("requires every correct option and no incorrect ones", () => {
    const qs = [
      question({
        id: "q",
        type: "mcq",
        points: 2,
        options: [
          option("a", "A", true),
          option("b", "B", true),
          option("c", "C", false),
        ],
      }),
    ]
    expect(gradeLocally(qs, { q: answer("q", ["a", "b"]) }, 50).score).toBe(100)
    // A partial answer earns nothing, matching the server.
    expect(gradeLocally(qs, { q: answer("q", ["a"]) }, 50).score).toBe(0)
    // An extra wrong pick loses the mark.
    expect(gradeLocally(qs, { q: answer("q", ["a", "b", "c"]) }, 50).score).toBe(0)
  })

  it("is not order-sensitive", () => {
    const qs = [
      question({
        id: "q",
        type: "mcq",
        options: [option("a", "A", true), option("b", "B", true)],
      }),
    ]
    expect(gradeLocally(qs, { q: answer("q", ["b", "a"]) }, 50).score).toBe(100)
  })

  it("matches fill-in-the-blank case-insensitively and ignores padding", () => {
    const qs = [question({ id: "q", type: "fill_blank", options: [option("o", "Sepsis", true)] })]
    expect(gradeLocally(qs, { q: answer("q", [], "  sepsis ") }, 50).score).toBe(100)
    expect(gradeLocally(qs, { q: answer("q", [], "asthma") }, 50).score).toBe(0)
  })

  it("does not award a mark for an empty text answer", () => {
    const qs = [question({ id: "q", type: "fill_blank", options: [option("o", "", true)] })]
    expect(gradeLocally(qs, { q: answer("q", [], "") }, 50).score).toBe(0)
  })

  it("flags an assessment containing free text as not fully auto-graded", () => {
    const qs = [
      question({ id: "a", type: "true_false", options: [option("y", "True", true)] }),
      question({ id: "b", type: "free_text" }),
    ]
    const result = gradeLocally(qs, { a: answer("a", ["y"]) }, 50)
    expect(result.autoGraded).toBe(false)
    // Free text carries points but cannot be marked here, so it scores nothing
    // until a trainer grades it. The server behaves the same way.
    expect(result.score).toBe(50)
  })

  it("weights by points rather than by question count", () => {
    const qs = [
      question({
        id: "cheap",
        type: "true_false",
        points: 1,
        options: [option("y", "True", true)],
      }),
      question({
        id: "dear",
        type: "true_false",
        points: 9,
        options: [option("y2", "True", true)],
      }),
    ]
    expect(gradeLocally(qs, { dear: answer("dear", ["y2"]) }, 50).score).toBe(90)
  })

  it("applies the pass mark inclusively", () => {
    const qs = [
      question({ id: "a", type: "true_false", options: [option("y", "True", true)] }),
      question({ id: "b", type: "true_false", options: [option("y2", "True", true)] }),
    ]
    const half = gradeLocally(qs, { a: answer("a", ["y"]) }, 50)
    expect(half.score).toBe(50)
    expect(half.passed).toBe(true)
  })

  it("scores an empty assessment as zero rather than dividing by zero", () => {
    expect(gradeLocally([], {}, 50)).toEqual({ score: 0, passed: false, autoGraded: true })
  })

  it("gives no marks for a question whose answer key is missing", () => {
    // A question with no correct option cannot be answered correctly. The
    // server requires a non-empty key too, so preview must not be generous.
    const qs = [
      question({ id: "q", type: "mcq", options: [option("a", "A", false)] }),
    ]
    expect(gradeLocally(qs, { q: answer("q", ["a"]) }, 50).score).toBe(0)
  })
})
