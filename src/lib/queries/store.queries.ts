import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { Coupon, Order, Product } from "@/types/database.types"

export function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100)
}

/* -------------------------------------------------------------- products -- */

export function useProducts() {
  return useQuery({
    queryKey: ["store", "products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error) {
        console.error("[useProducts]", error)
        throw error
      }
      return (data ?? []) as Product[]
    },
  })
}

export function useProductMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ["store", "products"] })
  const create = useMutation({
    mutationFn: async (input: {
      name: string
      description: string
      pricePence: number
      courseId: string | null
      createdBy: string
    }) => {
      const { error } = await supabase.from("products").insert({
        name: input.name.trim(),
        description: input.description.trim() || null,
        price_pence: input.pricePence,
        course_id: input.courseId,
        created_by: input.createdBy,
        is_published: true,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
  return { create, remove }
}

/* --------------------------------------------------------------- coupons -- */

export function useCoupons() {
  return useQuery({
    queryKey: ["store", "coupons"],
    queryFn: async (): Promise<Coupon[]> => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) {
        console.error("[useCoupons]", error)
        throw error
      }
      return (data ?? []) as Coupon[]
    },
  })
}

export function useCouponMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ["store", "coupons"] })
  const create = useMutation({
    mutationFn: async (input: {
      code: string
      percentOff: number | null
      amountOffPence: number | null
    }) => {
      const { error } = await supabase.from("coupons").insert({
        code: input.code.trim().toUpperCase(),
        percent_off: input.percentOff,
        amount_off_pence: input.amountOffPence,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
  const toggle = useMutation({
    mutationFn: async (input: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: input.isActive })
        .eq("id", input.id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
  return { create, toggle }
}

/** Resolve a coupon code to a discount on a given pence total. */
export async function applyCoupon(
  code: string,
  totalPence: number,
): Promise<{ code: string; discountPence: number } | null> {
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle()
  if (!data) return null
  const c = data as Coupon
  if (c.expires_at && new Date(c.expires_at) < new Date()) return null
  if (c.max_uses !== null && c.used_count >= c.max_uses) return null
  let discount = 0
  if (c.percent_off) discount = Math.round((totalPence * c.percent_off) / 100)
  else if (c.amount_off_pence) discount = c.amount_off_pence
  return { code: c.code, discountPence: Math.min(discount, totalPence) }
}

/* ---------------------------------------------------------------- orders -- */

export function useCreateOrder(buyerId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      product: Product
      paymentMethod: "bank_transfer" | "paypal"
      couponCode?: string
    }): Promise<string> => {
      let total = input.product.price_pence
      let coupon: string | null = null
      if (input.couponCode) {
        const applied = await applyCoupon(input.couponCode, total)
        if (applied) {
          total -= applied.discountPence
          coupon = applied.code
        }
      }
      const reference = `VC-${Date.now().toString(36).toUpperCase()}`
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          buyer_id: buyerId,
          status: "pending",
          total_pence: total,
          payment_method: input.paymentMethod,
          coupon_code: coupon,
          reference,
        })
        .select("id")
        .single()
      if (error) {
        console.error("[useCreateOrder]", error)
        throw error
      }
      await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: input.product.id,
        quantity: 1,
        unit_price_pence: input.product.price_pence,
      })
      // Count the coupon use so max_uses is enforced (RLS blocks a direct
      // update by the buyer, so this goes through a SECURITY DEFINER RPC).
      if (coupon) {
        const rpc = supabase.rpc as unknown as (
          fn: string,
          args: Record<string, unknown>,
        ) => Promise<{ error: { message: string } | null }>
        const { error: rErr } = await rpc("redeem_coupon", { p_code: coupon })
        if (rErr) console.error("[useCreateOrder:redeem]", rErr)
      }
      return order.id as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store", "orders"] }),
  })
}

export interface OrderRow extends Order {
  buyerName: string
  items: string
}

export function useOrders(staff: boolean, buyerId?: string) {
  return useQuery({
    queryKey: ["store", "orders", staff ? "all" : buyerId ?? "none"],
    queryFn: async (): Promise<OrderRow[]> => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false })
      if (!staff && buyerId) q = q.eq("buyer_id", buyerId)
      const { data, error } = await q
      if (error) {
        console.error("[useOrders]", error)
        throw error
      }
      const rows = (data ?? []) as Order[]
      if (!rows.length) return []
      const buyerIds = [...new Set(rows.map((r) => r.buyer_id).filter(Boolean))] as string[]
      const orderIds = rows.map((r) => r.id)
      const [{ data: profiles }, { data: items }] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name, full_name").in("id", buyerIds.length ? buyerIds : ["none"]),
        supabase.from("order_items").select("order_id, product_id, quantity").in("order_id", orderIds),
      ])
      const nameById = new Map(
        (profiles ?? []).map((p) => [
          p.id,
          p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Buyer",
        ]),
      )
      const productIds = [...new Set((items ?? []).map((i) => i.product_id).filter(Boolean))] as string[]
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds.length ? productIds : ["none"])
      const prodName = new Map((products ?? []).map((p) => [p.id, p.name]))
      const itemsByOrder = new Map<string, string[]>()
      for (const i of items ?? []) {
        const arr = itemsByOrder.get(i.order_id) ?? []
        arr.push(i.product_id ? prodName.get(i.product_id) ?? "Item" : "Item")
        itemsByOrder.set(i.order_id, arr)
      }
      return rows.map((r) => ({
        ...r,
        buyerName: r.buyer_id ? nameById.get(r.buyer_id) ?? "Buyer" : "Guest",
        items: (itemsByOrder.get(r.id) ?? []).join(", "),
      }))
    },
  })
}

/* ----------------------------------------------------------- dashboard -- */

export interface StoreStats {
  totalProducts: number
  publishedProducts: number
  draftProducts: number
  totalOrders: number
  paidOrders: number
  pendingOrders: number
  /** Collected revenue from paid orders, in pence. */
  revenuePence: number
  /** Outstanding value of pending orders, in pence. */
  outstandingPence: number
  /** Average paid order value, in pence (0 if none paid). */
  averageOrderPence: number
  /** Orders count per month over the last 6 calendar months, oldest first. */
  ordersByMonth: { label: string; orders: number; revenuePence: number }[]
  /** Product counts grouped by published state. */
  statusBreakdown: { label: string; count: number }[]
  /** Top products by paid units sold (max 6). */
  topProducts: {
    id: string
    name: string
    pricePence: number
    thumbnailUrl: string | null
    unitsSold: number
    revenuePence: number
  }[]
}

/**
 * Aggregate store metrics derived entirely from real products + orders.
 * Revenue is only counted from orders marked `paid`. Nothing is fabricated.
 */
export function useStoreStats(): ReturnType<typeof useQuery<StoreStats>> {
  return useQuery({
    queryKey: ["store", "stats"],
    queryFn: async (): Promise<StoreStats> => {
      const [{ data: products, error: pErr }, { data: orders, error: oErr }] =
        await Promise.all([
          supabase
            .from("products")
            .select("id, name, price_pence, thumbnail_url, is_published")
            .is("deleted_at", null),
          supabase
            .from("orders")
            .select("id, status, total_pence, created_at, paid_at"),
        ])
      if (pErr) {
        console.error("[useStoreStats:products]", pErr)
        throw pErr
      }
      if (oErr) {
        console.error("[useStoreStats:orders]", oErr)
        throw oErr
      }

      const prods = (products ?? []) as Pick<
        Product,
        "id" | "name" | "price_pence" | "thumbnail_url" | "is_published"
      >[]
      const ords = (orders ?? []) as Pick<
        Order,
        "id" | "status" | "total_pence" | "created_at" | "paid_at"
      >[]

      const publishedProducts = prods.filter((p) => p.is_published).length
      const paid = ords.filter((o) => o.status === "paid")
      const pending = ords.filter((o) => o.status === "pending")
      const revenuePence = paid.reduce((sum, o) => sum + o.total_pence, 0)
      const outstandingPence = pending.reduce((sum, o) => sum + o.total_pence, 0)

      // Six-month buckets, oldest first.
      const now = new Date()
      const buckets: { key: string; label: string; orders: number; revenuePence: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        buckets.push({
          key: `${d.getFullYear()}-${d.getMonth()}`,
          label: d.toLocaleString("en-GB", { month: "short" }),
          orders: 0,
          revenuePence: 0,
        })
      }
      const bucketByKey = new Map(buckets.map((b) => [b.key, b]))
      for (const o of ords) {
        const d = new Date(o.created_at)
        const b = bucketByKey.get(`${d.getFullYear()}-${d.getMonth()}`)
        if (!b) continue
        b.orders += 1
        if (o.status === "paid") b.revenuePence += o.total_pence
      }

      // Top products by paid units. Pull items for paid orders only.
      const paidIds = paid.map((o) => o.id)
      const unitsByProduct = new Map<string, number>()
      const revenueByProduct = new Map<string, number>()
      if (paidIds.length) {
        const { data: items } = await supabase
          .from("order_items")
          .select("product_id, quantity, unit_price_pence, order_id")
          .in("order_id", paidIds)
        for (const it of items ?? []) {
          if (!it.product_id) continue
          unitsByProduct.set(
            it.product_id,
            (unitsByProduct.get(it.product_id) ?? 0) + it.quantity,
          )
          revenueByProduct.set(
            it.product_id,
            (revenueByProduct.get(it.product_id) ?? 0) +
              it.quantity * it.unit_price_pence,
          )
        }
      }

      const topProducts = prods
        .map((p) => ({
          id: p.id,
          name: p.name,
          pricePence: p.price_pence,
          thumbnailUrl: p.thumbnail_url,
          unitsSold: unitsByProduct.get(p.id) ?? 0,
          revenuePence: revenueByProduct.get(p.id) ?? 0,
        }))
        .sort((a, b) => b.unitsSold - a.unitsSold || b.pricePence - a.pricePence)
        .slice(0, 6)

      return {
        totalProducts: prods.length,
        publishedProducts,
        draftProducts: prods.length - publishedProducts,
        totalOrders: ords.length,
        paidOrders: paid.length,
        pendingOrders: pending.length,
        revenuePence,
        outstandingPence,
        averageOrderPence: paid.length ? Math.round(revenuePence / paid.length) : 0,
        ordersByMonth: buckets.map((b) => ({
          label: b.label,
          orders: b.orders,
          revenuePence: b.revenuePence,
        })),
        statusBreakdown: [
          { label: "Published", count: publishedProducts },
          { label: "Draft", count: prods.length - publishedProducts },
        ],
        topProducts,
      }
    },
    staleTime: 60 * 1000,
  })
}

/** Staff: mark an order paid and auto-enrol the buyer on any linked courses. */
export function useConfirmOrder(confirmerId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data: order, error } = await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          confirmed_by: confirmerId,
        })
        .eq("id", orderId)
        .select("buyer_id, coupon_code")
        .single()
      if (error) {
        console.error("[useConfirmOrder]", error)
        throw error
      }
      // Enrol buyer on linked courses.
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id")
        .eq("order_id", orderId)
      const productIds = (items ?? []).map((i) => i.product_id).filter(Boolean) as string[]
      if (order.buyer_id && productIds.length) {
        const buyerId = order.buyer_id
        const { data: products } = await supabase
          .from("products")
          .select("course_id")
          .in("id", productIds)
        const courseIds = [...new Set((products ?? []).map((p) => p.course_id).filter(Boolean))] as string[]
        if (courseIds.length) {
          const { data: existing } = await supabase
            .from("enrollments")
            .select("course_id")
            .eq("learner_id", order.buyer_id)
            .in("course_id", courseIds)
            .is("deleted_at", null)
          const already = new Set((existing ?? []).map((e) => e.course_id))
          const toEnrol = courseIds.filter((c) => !already.has(c))
          if (toEnrol.length) {
            await supabase.from("enrollments").insert(
              toEnrol.map((course_id) => ({
                learner_id: buyerId,
                course_id,
                status: "not_started" as const,
              })),
            )
          }
        }
      }
      // Count coupon usage.
      if (order.coupon_code) {
        const { data: c } = await supabase
          .from("coupons")
          .select("id, used_count")
          .eq("code", order.coupon_code)
          .maybeSingle()
        if (c) await supabase.from("coupons").update({ used_count: c.used_count + 1 }).eq("id", c.id)
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store", "orders"] }),
  })
}
