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
