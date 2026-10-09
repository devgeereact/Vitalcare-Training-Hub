import { beforeAll, describe, expect, it } from "vitest"

import {
  anonymousClient,
  canRun,
  signInAs,
  SKIP_REASON,
  type Session,
} from "./helpers"

/**
 * What a learner can see of the catalogue.
 *
 * `courses_read` allowed `is_published or is_staff()`, so unpublishing a course
 * took it away from everybody already enrolled on it. The enrolment, the lesson
 * progress and the assessment attempts survived; the course they belonged to
 * did not. Somebody who had paid for training lost it because a catalogue flag
 * changed. Migration 096 lets a learner read a course they hold a live
 * enrolment on, and nothing more.
 */
const enabled = canRun("admin", "learner", "otherUser")

describe.skipIf(!enabled)("course visibility", () => {
  let admin: Session
  let learner: Session
  let other: Session
  let unpublishedId: string

  beforeAll(async () => {
    ;[admin, learner, other] = await Promise.all([
      signInAs("admin"),
      signInAs("learner"),
      signInAs("otherUser"),
    ])

    const stamp = Date.now().toString(36)
    const { data, error } = await admin.client
      .from("courses")
      .insert({
        title: `QA visibility ${stamp} (do not publish)`,
        slug: `qa-visibility-${stamp}`,
        summary: "Fixture course for the visibility suite.",
        cpd_hours: 1,
        duration_mins: 10,
        is_published: false,
      })
      .select("id")
      .single()
    if (error) throw error
    unpublishedId = data.id

    const { error: eErr } = await admin.client
      .from("enrollments")
      .insert({ course_id: unpublishedId, learner_id: learner.userId, status: "not_started" })
    if (eErr) throw eErr
  })

  it("a learner can read a course they are enrolled on, published or not", async () => {
    const { data } = await learner.client
      .from("courses")
      .select("id, title")
      .eq("id", unpublishedId)
      .maybeSingle()
    expect(data?.id).toBe(unpublishedId)
  })

  it("someone not enrolled cannot read that same course", async () => {
    const { data } = await other.client
      .from("courses")
      .select("id")
      .eq("id", unpublishedId)
      .maybeSingle()
    expect(data).toBeNull()
  })

  it("an anonymous visitor cannot read it either", async () => {
    // The enrolled learner can, which is the point of the widened policy.
    const { data } = await learner.client
      .from("courses")
      .select("id")
      .eq("id", unpublishedId)
      .is("deleted_at", null)
    expect(data ?? []).toHaveLength(1)

    // The same query, signed in as nobody, returns nothing.
    const { data: anon } = await anonymousClient()
      .from("courses")
      .select("id")
      .eq("id", unpublishedId)
    expect(anon ?? []).toHaveLength(0)
  })

  it("withdrawing the enrolment withdraws the course with it", async () => {
    const { error } = await admin.client
      .from("enrollments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("course_id", unpublishedId)
      .eq("learner_id", learner.userId)
    expect(error).toBeNull()

    const { data } = await learner.client
      .from("courses")
      .select("id")
      .eq("id", unpublishedId)
      .maybeSingle()
    expect(data).toBeNull()

    // Put it back for any re-run.
    await admin.client
      .from("enrollments")
      .update({ deleted_at: null })
      .eq("course_id", unpublishedId)
      .eq("learner_id", learner.userId)
  })
})

describe.skipIf(enabled)("course visibility (skipped)", () => {
  it("is skipped without credentials", () => {
    expect(SKIP_REASON).toContain("Skipped is not passed")
  })
})
