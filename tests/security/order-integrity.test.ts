import { beforeAll, describe, expect, it } from "vitest"

import { canRun, signInAs, SKIP_REASON, type Session } from "./helpers"

/**
 * Ordering, against the real database, as the real roles.
 *
 * The money path is the one place where believing the browser is expensive.
 * These prove the server prices the order, writes it whole or not at all,
 * counts a coupon once, and lets only staff move it between states.
 *
 * Everything is created here and left `pending` or `cancelled`. No fixture is
 * ever confirmed into an enrolment except the one test that checks
 * confirmation, which uses its own order.
 */
const enabled = canRun("admin", "learner")

const PRODUCT_NAME = "QA order integrity fixture (do not publish externally)"
const PRICE_PENCE = 12_345

interface Fixture {
  productId: string
  courseId: string
}

describe.skipIf(!enabled)("order integrity", () => {
  let admin: Session
  let learner: Session
  let fixture: Fixture

  beforeAll(async () => {
    ;[admin, learner] = await Promise.all([signInAs("admin"), signInAs("learner")])
    fixture = await buildFixture(admin)
  })

  async function buildFixture(staff: Session): Promise<Fixture> {
    const { data: existingCourse } = await staff.client
      .from("courses")
      .select("id")
      .eq("slug", "qa-order-integrity")
      .is("deleted_at", null)
      .maybeSingle()
    let courseId = existingCourse?.id as string | undefined
    if (!courseId) {
      const { data, error } = await staff.client
        .from("courses")
        .insert({
          title: "QA order integrity (do not publish)",
          slug: "qa-order-integrity",
          summary: "Fixture course for the order integrity suite.",
          cpd_hours: 1,
          duration_mins: 30,
          is_published: false,
        })
        .select("id")
        .single()
      if (error) throw error
      courseId = data.id
    }

    const { data: existingProduct } = await staff.client
      .from("products")
      .select("id")
      .eq("name", PRODUCT_NAME)
      .is("deleted_at", null)
      .maybeSingle()
    let productId = existingProduct?.id as string | undefined
    if (!productId) {
      const { data, error } = await staff.client
        .from("products")
        .insert({
          name: PRODUCT_NAME,
          description: "Fixture product.",
          price_pence: PRICE_PENCE,
          course_id: courseId,
          is_published: true,
        })
        .select("id")
        .single()
      if (error) throw error
      productId = data.id
    }
    return { productId, courseId: courseId! }
  }

  /** Place an order as the learner and return the single returned row. */
  async function place(
    session: Session,
    args: Record<string, unknown>,
  ): Promise<{ data: PlacedRow | null; error: { message: string } | null }> {
    const { data, error } = await session.client.rpc("place_order", args)
    const rows = (data ?? []) as PlacedRow[]
    return { data: rows[0] ?? null, error }
  }

  interface PlacedRow {
    order_id: string
    reference: string
    total_pence: number
    discount_pence: number
    coupon_code: string | null
  }

  it("prices the order from the catalogue, not from the caller", async () => {
    const { data, error } = await place(learner, {
      p_product: fixture.productId,
      p_payment_method: "bank_transfer",
      p_coupon: null,
    })
    expect(error).toBeNull()
    expect(data?.total_pence).toBe(PRICE_PENCE)
  })

  it("gives every order a unique, readable reference", async () => {
    const [a, b] = await Promise.all([
      place(learner, { p_product: fixture.productId, p_payment_method: "bank_transfer" }),
      place(learner, { p_product: fixture.productId, p_payment_method: "paypal" }),
    ])
    expect(a.data?.reference).toMatch(/^VC-\d{4}-\d+$/)
    expect(b.data?.reference).toMatch(/^VC-\d{4}-\d+$/)
    expect(a.data?.reference).not.toBe(b.data?.reference)
  })

  it("writes the order and its item together", async () => {
    const { data } = await place(learner, {
      p_product: fixture.productId,
      p_payment_method: "bank_transfer",
    })
    const { data: items } = await learner.client
      .from("order_items")
      .select("product_id, quantity, unit_price_pence")
      .eq("order_id", data!.order_id)
    expect(items).toHaveLength(1)
    expect(items![0].unit_price_pence).toBe(PRICE_PENCE)
  })

  it("a learner cannot insert an order at a price of their choosing", async () => {
    const { error } = await learner.client
      .from("orders")
      .insert({
        buyer_id: learner.userId,
        status: "pending",
        total_pence: 0,
        payment_method: "bank_transfer",
      })
      .select("id")
    expect(error).not.toBeNull()
  })

  it("a learner cannot add an item to their own order by hand", async () => {
    const { data } = await place(learner, {
      p_product: fixture.productId,
      p_payment_method: "bank_transfer",
    })
    const { error } = await learner.client.from("order_items").insert({
      order_id: data!.order_id,
      product_id: fixture.productId,
      quantity: 99,
      unit_price_pence: 0,
    })
    expect(error).not.toBeNull()
  })

  it("refuses an unknown payment method", async () => {
    const { error } = await place(learner, {
      p_product: fixture.productId,
      p_payment_method: "crypto",
    })
    expect(error).not.toBeNull()
  })

  it("refuses an unpublished product", async () => {
    const { data: hidden, error: cErr } = await admin.client
      .from("products")
      .insert({
        name: "QA hidden fixture",
        price_pence: 100,
        is_published: false,
      })
      .select("id")
      .single()
    expect(cErr).toBeNull()
    const { error } = await place(learner, {
      p_product: hidden!.id,
      p_payment_method: "bank_transfer",
    })
    expect(error).not.toBeNull()
    await admin.client
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", hidden!.id)
  })

  describe("coupons", () => {
    it("applies a valid coupon on the server and reports what was charged", async () => {
      const code = `QA10${Date.now().toString(36).toUpperCase()}`
      const { error: cErr } = await admin.client
        .from("coupons")
        .insert({ code, percent_off: 10 })
      expect(cErr).toBeNull()

      const { data } = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
        p_coupon: code,
      })
      expect(data?.coupon_code).toBe(code)
      expect(data?.discount_pence).toBe(Math.round(PRICE_PENCE * 0.1))
      expect(data?.total_pence).toBe(PRICE_PENCE - Math.round(PRICE_PENCE * 0.1))
    })

    it("ignores an expired coupon and charges the full price", async () => {
      const code = `QAEXP${Date.now().toString(36).toUpperCase()}`
      await admin.client.from("coupons").insert({
        code,
        percent_off: 50,
        expires_at: new Date(Date.now() - 86_400_000).toISOString(),
      })
      const { data } = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
        p_coupon: code,
      })
      expect(data?.coupon_code).toBeNull()
      expect(data?.total_pence).toBe(PRICE_PENCE)

      // Leave the register tidy. An expired coupon left active trips the
      // housekeeping assertion in feature-coverage, which is checking the
      // real data rather than this fixture.
      await admin.client
        .from("coupons")
        .update({ is_active: false })
        .eq("code", code)
    })

    it("ignores a coupon that has reached its usage cap", async () => {
      const code = `QACAP${Date.now().toString(36).toUpperCase()}`
      await admin.client
        .from("coupons")
        .insert({ code, percent_off: 50, max_uses: 1 })

      const first = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
        p_coupon: code,
      })
      expect(first.data?.coupon_code).toBe(code)

      const second = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
        p_coupon: code,
      })
      expect(second.data?.coupon_code).toBeNull()
      expect(second.data?.total_pence).toBe(PRICE_PENCE)
    })

    it("never discounts below zero", async () => {
      const code = `QABIG${Date.now().toString(36).toUpperCase()}`
      await admin.client
        .from("coupons")
        .insert({ code, amount_off_pence: PRICE_PENCE * 10 })
      const { data } = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
        p_coupon: code,
      })
      expect(data?.total_pence).toBe(0)
      expect(data?.discount_pence).toBe(PRICE_PENCE)
    })
  })

  describe("status changes", () => {
    it("a learner cannot confirm their own order", async () => {
      const { data } = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
      })
      const { error } = await learner.client.rpc("confirm_order", {
        p_order: data!.order_id,
      })
      expect(error).not.toBeNull()
    })

    it("a learner cannot cancel or refund an order", async () => {
      const { data } = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
      })
      const { error } = await learner.client.rpc("set_order_status", {
        p_order: data!.order_id,
        p_status: "cancelled",
      })
      expect(error).not.toBeNull()
    })

    it("confirming twice enrols once and reports the second as a refusal", async () => {
      const { data } = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
      })
      const first = await admin.client.rpc("confirm_order", { p_order: data!.order_id })
      const second = await admin.client.rpc("confirm_order", { p_order: data!.order_id })
      expect(first.data).toBe(true)
      expect(second.data).toBe(false)

      const { data: enrolments } = await admin.client
        .from("enrollments")
        .select("id")
        .eq("learner_id", learner.userId)
        .eq("course_id", fixture.courseId)
        .is("deleted_at", null)
      expect(enrolments).toHaveLength(1)
    })

    it("a cancelled order cannot then be confirmed", async () => {
      const { data } = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
      })
      const cancelled = await admin.client.rpc("set_order_status", {
        p_order: data!.order_id,
        p_status: "cancelled",
        p_reason: "QA: booking withdrawn",
      })
      expect(cancelled.data).toBe(true)

      const confirmed = await admin.client.rpc("confirm_order", {
        p_order: data!.order_id,
      })
      expect(confirmed.data).toBe(false)

      const { data: row } = await admin.client
        .from("orders")
        .select("status")
        .eq("id", data!.order_id)
        .single()
      expect(row!.status).toBe("cancelled")
    })

    it("an unpaid order cannot be refunded", async () => {
      const { data } = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
      })
      const { error } = await admin.client.rpc("set_order_status", {
        p_order: data!.order_id,
        p_status: "refunded",
      })
      expect(error).not.toBeNull()
    })

    it("confirmation cannot be forced through set_order_status", async () => {
      const { data } = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
      })
      const { error } = await admin.client.rpc("set_order_status", {
        p_order: data!.order_id,
        p_status: "paid",
      })
      expect(error).not.toBeNull()
    })

    it("cancelling twice is harmless", async () => {
      const { data } = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
      })
      const args = { p_order: data!.order_id, p_status: "cancelled" }
      const first = await admin.client.rpc("set_order_status", args)
      const second = await admin.client.rpc("set_order_status", args)
      expect(first.data).toBe(true)
      expect(second.data).toBe(true)
    })

    it("cancelling returns the coupon use the order reserved", async () => {
      const code = `QAREL${Date.now().toString(36).toUpperCase()}`
      await admin.client
        .from("coupons")
        .insert({ code, percent_off: 25, max_uses: 1 })

      const { data } = await place(learner, {
        p_product: fixture.productId,
        p_payment_method: "bank_transfer",
        p_coupon: code,
      })
      expect(data?.coupon_code).toBe(code)

      const { data: used } = await admin.client
        .from("coupons")
        .select("used_count")
        .eq("code", code)
        .single()
      expect(used!.used_count).toBe(1)

      await admin.client.rpc("set_order_status", {
        p_order: data!.order_id,
        p_status: "cancelled",
      })

      const { data: after } = await admin.client
        .from("coupons")
        .select("used_count")
        .eq("code", code)
        .single()
      expect(after!.used_count).toBe(0)
    })
  })
})

describe.skipIf(enabled)("order integrity (skipped)", () => {
  it("is skipped without credentials", () => {
    expect(SKIP_REASON).toContain("Skipped is not passed")
  })
})
