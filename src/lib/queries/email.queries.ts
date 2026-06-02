import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { EmailCampaign } from "@/types/database.types"

export function useCampaigns() {
  return useQuery({
    queryKey: ["email", "campaigns"],
    queryFn: async (): Promise<EmailCampaign[]> => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("scheduled_at", { ascending: false })
        .limit(100)
      if (error) {
        console.error("[useCampaigns]", error)
        throw error
      }
      return (data ?? []) as EmailCampaign[]
    },
  })
}

export function useScheduleCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      subject: string
      message: string
      audience: string
      scheduledAt: string
      createdBy: string
    }) => {
      const { error } = await supabase.from("email_campaigns").insert({
        subject: input.subject.trim(),
        message: input.message.trim(),
        audience: input.audience,
        scheduled_at: new Date(input.scheduledAt).toISOString(),
        created_by: input.createdBy,
      })
      if (error) {
        console.error("[useScheduleCampaign]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email", "campaigns"] }),
  })
}

export function useCancelCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_campaigns")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("status", "scheduled")
      if (error) {
        console.error("[useCancelCampaign]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email", "campaigns"] }),
  })
}
