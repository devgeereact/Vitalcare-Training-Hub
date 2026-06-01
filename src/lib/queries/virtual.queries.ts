import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { TrainingSession } from "@/types/database.types"

export function useVirtualSessions() {
  return useQuery({
    queryKey: ["virtual", "sessions"],
    queryFn: async (): Promise<TrainingSession[]> => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("is_virtual", true)
        .is("deleted_at", null)
        .order("starts_at", { ascending: true })
        .limit(200)
      if (error) {
        console.error("[useVirtualSessions]", error)
        throw error
      }
      return (data ?? []) as TrainingSession[]
    },
  })
}
