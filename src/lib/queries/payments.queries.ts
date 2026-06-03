import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { SubscriptionPlan, Subscription } from "@/types/database.types"

export function usePlans() {
  return useQuery({
    queryKey: ["payments", "plans"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .is("deleted_at", null)
        .order("price_pence", { ascending: true })
      if (error) {
        console.error("[usePlans]", error)
        throw error
      }
      return (data ?? []) as SubscriptionPlan[]
    },
  })
}

export interface SubscriptionHistoryRow extends Subscription {
  planName: string
  pricePence: number
  interval: string
}

export function useSubscriptionHistory(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ["payments", "history", orgId ?? "none"],
    enabled: !!orgId,
    queryFn: async (): Promise<SubscriptionHistoryRow[]> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organisation_id", orgId!)
        .is("deleted_at", null)
        .order("started_at", { ascending: false })
      if (error) {
        console.error("[useSubscriptionHistory]", error)
        throw error
      }
      const rows = (data ?? []) as Subscription[]
      const planIds = [...new Set(rows.map((r) => r.plan_id).filter(Boolean))] as string[]
      const planById = new Map<string, { name: string; price_pence: number; interval: string }>()
      if (planIds.length) {
        const { data: plans } = await supabase
          .from("subscription_plans")
          .select("id, name, price_pence, interval")
          .in("id", planIds)
        for (const p of plans ?? [])
          planById.set(p.id, {
            name: p.name,
            price_pence: p.price_pence,
            interval: p.interval,
          })
      }
      return rows.map((r) => {
        const plan = r.plan_id ? planById.get(r.plan_id) : undefined
        return {
          ...r,
          planName: plan?.name ?? "Custom",
          pricePence: plan?.price_pence ?? 0,
          interval: plan?.interval ?? "-",
        }
      })
    },
  })
}

export interface OrgSubscription extends Subscription {
  planName: string
}

export function useSubscription(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ["payments", "subscription", orgId ?? "none"],
    enabled: !!orgId,
    queryFn: async (): Promise<OrgSubscription | null> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organisation_id", orgId!)
        .is("deleted_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) {
        console.error("[useSubscription]", error)
        throw error
      }
      if (!data) return null
      let planName = "Custom"
      if (data.plan_id) {
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("name")
          .eq("id", data.plan_id)
          .maybeSingle()
        planName = plan?.name ?? "Custom"
      }
      return { ...(data as Subscription), planName }
    },
  })
}
