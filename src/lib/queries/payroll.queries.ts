import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { Payroll, PayrollStatus } from "@/types/database.types"

/** Format pence as GBP, e.g. 125000 -> "£1,250.00". */
export function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100)
}

export const payrollKeys = {
  all: ["payroll"] as const,
  list: (scope: string) => [...payrollKeys.all, "list", scope] as const,
}

/**
 * Payslips. Admins (is_admin RLS) see all; everyone else sees their own
 * rows only. Pass admin=false to scope the query to one staff member.
 */
export function usePayroll(admin: boolean, staffId?: string) {
  return useQuery({
    queryKey: payrollKeys.list(admin ? "all" : staffId ?? "none"),
    enabled: admin || !!staffId,
    queryFn: async (): Promise<Payroll[]> => {
      let q = supabase
        .from("payroll")
        .select("*")
        .order("created_at", { ascending: false })
      if (!admin && staffId) q = q.eq("staff_id", staffId)
      const { data, error } = await q
      if (error) {
        console.error("[usePayroll]", error)
        throw error
      }
      return (data ?? []) as Payroll[]
    },
  })
}

export interface PayrollInput {
  staffId: string
  staffName: string
  staffEmail: string | null
  period: string
  periodStart: string | null
  periodEnd: string | null
  grossPence: number
  deductionsPence: number
  notes: string | null
  issuedBy: string
}

export function usePayrollMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: payrollKeys.all })

  const create = useMutation({
    mutationFn: async (input: PayrollInput): Promise<Payroll> => {
      const net = Math.max(0, input.grossPence - input.deductionsPence)
      const { data, error } = await supabase
        .from("payroll")
        .insert({
          staff_id: input.staffId,
          staff_name: input.staffName,
          staff_email: input.staffEmail,
          period: input.period,
          period_start: input.periodStart,
          period_end: input.periodEnd,
          gross_pence: input.grossPence,
          deductions_pence: input.deductionsPence,
          net_pence: net,
          notes: input.notes,
          status: "approved",
          issued_by: input.issuedBy,
        })
        .select("*")
        .single()
      if (error) {
        console.error("[payroll.create]", error)
        throw error
      }
      return data as Payroll
    },
    onSuccess: invalidate,
  })

  const setStatus = useMutation({
    mutationFn: async (args: { id: string; status: PayrollStatus }): Promise<void> => {
      const patch: Partial<Payroll> = { status: args.status }
      if (args.status === "paid") patch.paid_at = new Date().toISOString()
      const { error } = await supabase.from("payroll").update(patch).eq("id", args.id)
      if (error) {
        console.error("[payroll.setStatus]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("payroll").delete().eq("id", id)
      if (error) {
        console.error("[payroll.remove]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  return { create, setStatus, remove }
}
