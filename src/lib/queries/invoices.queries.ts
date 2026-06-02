import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { Invoice, InvoiceItem, InvoiceStatus } from "@/types/database.types"

export function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(pence / 100)
}

export function useInvoices(staff: boolean, userId?: string) {
  return useQuery({
    queryKey: ["invoices", staff ? "all" : userId ?? "none"],
    queryFn: async (): Promise<Invoice[]> => {
      let q = supabase.from("invoices").select("*").order("created_at", { ascending: false })
      if (!staff && userId) q = q.eq("recipient_id", userId)
      const { data, error } = await q
      if (error) {
        console.error("[useInvoices]", error)
        throw error
      }
      return (data ?? []) as Invoice[]
    },
  })
}

export interface InvoiceInput {
  recipientId: string
  recipientName: string
  recipientEmail: string
  items: InvoiceItem[]
  dueDate: string
  notes: string
  issuedBy: string
}

export function useInvoiceMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ["invoices"] })

  const create = useMutation({
    mutationFn: async (input: InvoiceInput) => {
      const total = input.items.reduce((s, i) => s + i.quantity * i.unit_pence, 0)
      const number = `VC-INV-${Date.now().toString(36).toUpperCase()}`
      const { error } = await supabase.from("invoices").insert({
        number,
        recipient_id: input.recipientId,
        recipient_name: input.recipientName,
        recipient_email: input.recipientEmail || null,
        items: input.items,
        total_pence: total,
        status: "sent",
        due_date: input.dueDate || null,
        notes: input.notes.trim() || null,
        issued_by: input.issuedBy,
      })
      if (error) {
        console.error("[createInvoice]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  const setStatus = useMutation({
    mutationFn: async (input: { id: string; status: InvoiceStatus }) => {
      const { error } = await supabase
        .from("invoices")
        .update({
          status: input.status,
          paid_at: input.status === "paid" ? new Date().toISOString() : null,
        })
        .eq("id", input.id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, setStatus }
}
