import { beforeAll, describe, expect, it } from "vitest"

import { canRun, signInAs, SKIP_REASON, type Session } from "./helpers"

/**
 * What happens when two people, or one person with two tabs, do the same thing
 * at the same time.
 *
 * Every case here was a check-then-write from the browser, which is safe only
 * as long as nothing interleaves. The fix in each case is a database
 * constraint or a locking function, not more careful front-end code, so these
 * fire the requests genuinely concurrently and check the database's answer.
 *
 * Gated on migration 092: before it, there is no unique index to enforce any
 * of this, and the tests would fail for the right reason but at the wrong
 * time.
 */
const enabled = canRun("admin", "learner")
const constraintsApplied = process.env.MIGRATION_092_APPLIED === "1"

describe.skipIf(!enabled || !constraintsApplied)("concurrent writes", () => {
  let admin: Session
  let learner: Session

  beforeAll(async () => {
    ;[admin, learner] = await Promise.all([signInAs("admin"), signInAs("learner")])
  })

  it("five simultaneous certificate issues produce one certificate", async () => {
    const { data: courses } = await admin.client
      .from("courses")
      .select("id")
      .eq("slug", "qa-automated-journey")
      .is("deleted_at", null)
      .maybeSingle()
    const courseId = courses?.id as string | undefined
    if (!courseId) return

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        learner.client.rpc("issue_course_certificate", { p_course: courseId }),
      ),
    )
    const ids = new Set(results.map((r) => r.data).filter(Boolean))
    expect(ids.size, "concurrent issuance produced more than one certificate").toBe(1)

    const { count } = await learner.client
      .from("learner_certificates")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId)
      .eq("learner_id", learner.userId)
      .is("deleted_at", null)
    expect(count).toBe(1)
  })

  it("five simultaneous self-enrolments produce one enrolment", async () => {
    const { data: courses } = await admin.client
      .from("courses")
      .select("id")
      .eq("slug", "qa-automated-journey")
      .is("deleted_at", null)
      .maybeSingle()
    const courseId = courses?.id as string | undefined
    if (!courseId) return

    await Promise.all(
      Array.from({ length: 5 }, () =>
        learner.client.from("enrollments").insert({
          course_id: courseId,
          learner_id: learner.userId,
          status: "not_started",
        }),
      ),
    )

    const { count } = await learner.client
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId)
      .eq("learner_id", learner.userId)
      .is("deleted_at", null)
    expect(count, "duplicate enrolments were created").toBe(1)
  })

  it("a coupon is counted once per order, however many times redemption runs", async () => {
    const { data: coupons } = await admin.client
      .from("coupons")
      .select("id, code, used_count")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()
    if (!coupons) return

    const { data: orders } = await learner.client
      .from("orders")
      .select("id")
      .limit(1)
      .maybeSingle()
    if (!orders) return

    const before = Number(coupons.used_count)
    await Promise.all(
      Array.from({ length: 5 }, () =>
        learner.client.rpc("redeem_coupon_for_order", { p_order: orders.id as string }),
      ),
    )
    const { data: after } = await admin.client
      .from("coupons")
      .select("used_count")
      .eq("id", coupons.id as string)
      .maybeSingle()

    // Either the order carries this coupon and it counts exactly once, or it
    // does not and the count is untouched. What must never happen is five.
    expect(Number(after?.used_count) - before).toBeLessThanOrEqual(1)
  })

  it("confirming the same order twice does not enrol or charge twice", async () => {
    const { data: pending } = await admin.client
      .from("orders")
      .select("id, status")
      .eq("status", "pending")
      .limit(1)
      .maybeSingle()
    if (!pending) return

    const results = await Promise.all([
      admin.client.rpc("confirm_order", { p_order: pending.id as string }),
      admin.client.rpc("confirm_order", { p_order: pending.id as string }),
    ])
    // Exactly one call may report that it did the work.
    const applied = results.filter((r) => r.data === true).length
    expect(applied).toBeLessThanOrEqual(1)

    const { data: after } = await admin.client
      .from("orders")
      .select("status")
      .eq("id", pending.id as string)
      .maybeSingle()
    expect(after?.status).toBe("paid")
  })
})

describe.skipIf(enabled && constraintsApplied)("concurrent writes (skipped)", () => {
  it("is skipped without credentials or migration 092", () => {
    console.warn(
      `${SKIP_REASON}\nConcurrency assertions also need MIGRATION_092_APPLIED=1: ` +
        "the unique indexes they rely on arrive with that migration.",
    )
    expect(true).toBe(true)
  })
})
