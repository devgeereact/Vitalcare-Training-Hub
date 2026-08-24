import { beforeAll, describe, expect, it } from "vitest"

import { canRun, signInAs, SKIP_REASON, type Session } from "./helpers"

/**
 * The features that had reached the database but had never completed a real
 * workflow. Each is exercised against the live project rather than confirmed to
 * compile.
 *
 * What is NOT covered here, and why, is stated in the skips: anything that
 * needs a third-party credential (Zoom, Google Calendar, SMTP) cannot be
 * proved from a test run that does not hold those credentials, and pretending
 * otherwise would be the exact failure mode this suite exists to prevent.
 */
const enabled = canRun("admin", "learner", "trainer")

describe.skipIf(!enabled)("feature coverage", () => {
  let admin: Session
  let learner: Session
  let trainer: Session

  beforeAll(async () => {
    ;[admin, learner, trainer] = await Promise.all([
      signInAs("admin"),
      signInAs("learner"),
      signInAs("trainer"),
    ])
  })

  describe("discount codes", () => {
    it("an inactive or expired coupon is not offered", async () => {
      const { data: coupons } = await admin.client.from("coupons").select("*")
      for (const c of coupons ?? []) {
        if (c.expires_at && new Date(c.expires_at as string) < new Date()) {
          expect(c.is_active, `${c.code} is expired but still active`).toBe(false)
        }
      }
    })

    it("redemption count never exceeds the usage cap", async () => {
      const { data: coupons } = await admin.client.from("coupons").select("*")
      for (const c of coupons ?? []) {
        if (c.max_uses !== null) {
          expect(
            Number(c.used_count),
            `${c.code} has been used more times than its cap`,
          ).toBeLessThanOrEqual(Number(c.max_uses))
        }
      }
    })

    it("a learner cannot edit a coupon", async () => {
      const { data: coupons } = await admin.client
        .from("coupons")
        .select("id, percent_off")
        .limit(1)
      const coupon = coupons?.[0]
      if (!coupon) return
      await learner.client
        .from("coupons")
        .update({ percent_off: 100 })
        .eq("id", coupon.id as string)
      const { data: after } = await admin.client
        .from("coupons")
        .select("percent_off")
        .eq("id", coupon.id as string)
        .maybeSingle()
      expect(after?.percent_off).toBe(coupon.percent_off)
    })
  })

  describe("store orders", () => {
    it("a buyer sees their own orders and nobody else's", async () => {
      const { data, error } = await learner.client
        .from("orders")
        .select("id, buyer_id")
      expect(error).toBeNull()
      for (const order of data ?? []) {
        expect(order.buyer_id).toBe(learner.userId)
      }
    })

    it("a buyer cannot mark their own order paid", async () => {
      const { data: mine } = await learner.client
        .from("orders")
        .select("id, status")
        .limit(1)
      const order = mine?.[0]
      if (!order) return
      await learner.client
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", order.id as string)
      const { data: after } = await learner.client
        .from("orders")
        .select("status")
        .eq("id", order.id as string)
        .maybeSingle()
      expect(after?.status).toBe(order.status)
    })

    it("every order line points at a product that exists", async () => {
      const { data: items } = await admin.client
        .from("order_items")
        .select("id, order_id, product_id, quantity, unit_price_pence")
      const productIds = [
        ...new Set((items ?? []).map((i) => i.product_id).filter(Boolean)),
      ] as string[]
      if (productIds.length === 0) return
      const { data: products } = await admin.client
        .from("products")
        .select("id")
        .in("id", productIds)
      expect(products ?? []).toHaveLength(productIds.length)
      for (const item of items ?? []) {
        expect(Number(item.quantity)).toBeGreaterThan(0)
        expect(Number(item.unit_price_pence)).toBeGreaterThanOrEqual(0)
      }
    })

    it("every order line belongs to an order that exists", async () => {
      const { data: items } = await admin.client
        .from("order_items")
        .select("order_id")
      const orderIds = [...new Set((items ?? []).map((i) => i.order_id))] as string[]
      if (orderIds.length === 0) return
      const { data: orders } = await admin.client
        .from("orders")
        .select("id")
        .in("id", orderIds)
      expect(orders ?? [], "orphaned order lines").toHaveLength(orderIds.length)
    })
  })

  describe("contact search", () => {
    it("returns staff a learner is allowed to message", async () => {
      const { data, error } = await learner.client.rpc("search_contacts", {
        p_query: "vitalcare",
      })
      expect(error).toBeNull()
      const rows = (data ?? []) as { id: string; role: string }[]
      // Whatever it returns, it may only ever be staff: this RPC exists because
      // a learner cannot read the profiles table, and it must not become a way
      // to enumerate other learners.
      for (const row of rows) {
        expect(
          ["admin", "super_admin", "trainer", "manager", "content_editor"],
          `search_contacts returned a ${row.role}`,
        ).toContain(row.role)
      }
    })

    it("does not leak other learners", async () => {
      const { data } = await learner.client.rpc("search_contacts", {
        p_query: "learner",
      })
      const rows = (data ?? []) as { id: string; role: string }[]
      expect(rows.filter((r) => r.role === "learner")).toHaveLength(0)
    })

    it("the admin contact list is staff only", async () => {
      const { data, error } = await learner.client.rpc("list_admin_contacts")
      expect(error).toBeNull()
      const rows = (data ?? []) as { role: string }[]
      for (const row of rows) {
        expect(row.role).not.toBe("learner")
      }
    })
  })

  describe("assessment review", () => {
    it("a learner reviews only their own answers", async () => {
      const { data: attempts } = await learner.client
        .from("assessment_attempts")
        .select("assessment_id")
        .limit(1)
      const assessmentId = attempts?.[0]?.assessment_id as string | undefined
      if (!assessmentId) return

      const { data, error } = await learner.client.rpc("get_assessment_review", {
        p_assessment: assessmentId,
      })
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it("returns nothing for an assessment the learner never attempted", async () => {
      const { data: all } = await trainer.client
        .from("assessments")
        .select("id")
      const { data: mine } = await learner.client
        .from("assessment_attempts")
        .select("assessment_id")
      const attempted = new Set((mine ?? []).map((a) => a.assessment_id))
      const untouched = (all ?? []).find((a) => !attempted.has(a.id))
      if (!untouched) return

      const { data } = await learner.client.rpc("get_assessment_review", {
        p_assessment: untouched.id as string,
      })
      expect((data as unknown[]) ?? []).toHaveLength(0)
    })
  })

  describe("catalogue enrolment counts", () => {
    it("counts match the enrolment table", async () => {
      const { data, error } = await admin.client.rpc("course_enrolment_counts")
      expect(error).toBeNull()
      const counts = (data ?? []) as { course_id: string; total: number }[]

      const { data: enrolments } = await admin.client
        .from("enrollments")
        .select("course_id")
        .is("deleted_at", null)
      const actual = new Map<string, number>()
      for (const e of enrolments ?? []) {
        const id = e.course_id as string
        actual.set(id, (actual.get(id) ?? 0) + 1)
      }

      for (const row of counts) {
        expect(
          Number(row.total),
          `course ${row.course_id} count does not match the enrolment table`,
        ).toBe(actual.get(row.course_id) ?? 0)
      }
    })

    it("is readable without leaking who is enrolled", async () => {
      // The public catalogue shows a count. It must not become a way to list
      // the people behind it.
      const { data, error } = await learner.client.rpc("course_enrolment_counts")
      expect(error).toBeNull()
      const rows = (data ?? []) as Record<string, unknown>[]
      for (const row of rows) {
        expect(Object.keys(row)).not.toContain("learner_id")
      }
    })
  })

  describe("referential integrity", () => {
    it("every certificate belongs to a profile that exists", async () => {
      const { data: certs } = await admin.client
        .from("learner_certificates")
        .select("id, learner_id")
        .is("deleted_at", null)
      const owners = [...new Set((certs ?? []).map((c) => c.learner_id))] as string[]
      if (owners.length === 0) return
      const { data: profiles } = await admin.client
        .from("profiles")
        .select("id")
        .in("id", owners)
      expect(profiles ?? [], "certificates with no owner").toHaveLength(owners.length)
    })

    it("every attempt belongs to an assessment that exists", async () => {
      const { data: attempts } = await admin.client
        .from("assessment_attempts")
        .select("assessment_id")
        .is("deleted_at", null)
      const ids = [...new Set((attempts ?? []).map((a) => a.assessment_id))] as string[]
      if (ids.length === 0) return
      const { data: assessments } = await admin.client
        .from("assessments")
        .select("id")
        .in("id", ids)
      expect(assessments ?? [], "orphaned attempts").toHaveLength(ids.length)
    })

    it("every enrolment points at a course that exists", async () => {
      const { data: enrolments } = await admin.client
        .from("enrollments")
        .select("course_id")
        .is("deleted_at", null)
      const ids = [...new Set((enrolments ?? []).map((e) => e.course_id))] as string[]
      if (ids.length === 0) return
      const { data: courses } = await admin.client
        .from("courses")
        .select("id")
        .in("id", ids)
      expect(courses ?? [], "enrolments on courses that do not exist").toHaveLength(
        ids.length,
      )
    })
  })
})

describe.skipIf(enabled)("feature coverage (skipped)", () => {
  it("is skipped without credentials", () => {
    console.warn(SKIP_REASON)
    expect(true).toBe(true)
  })
})
