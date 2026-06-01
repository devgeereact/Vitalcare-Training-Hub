import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { AuditLog } from "@/types/database.types"

export interface AuditRow extends AuditLog {
  actorName: string
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit", "list"],
    queryFn: async (): Promise<AuditRow[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200)
      if (error) {
        console.error("[useAuditLogs]", error)
        throw error
      }
      const rows = (data ?? []) as AuditLog[]
      const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[]
      const nameById = new Map<string, string>()
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name, email")
          .in("id", ids)
        for (const p of profiles ?? [])
          nameById.set(
            p.id,
            p.full_name ||
              [p.first_name, p.last_name].filter(Boolean).join(" ") ||
              p.email,
          )
      }
      return rows.map((r) => ({
        ...r,
        actorName: r.user_id ? nameById.get(r.user_id) ?? "Unknown" : "System",
      }))
    },
  })
}
