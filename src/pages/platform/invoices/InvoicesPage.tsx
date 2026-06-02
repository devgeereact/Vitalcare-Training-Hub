import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Receipt,
  AlertCircle,
  Plus,
  Loader2,
  Download,
  Trash2,
  Check,
} from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUser } from "@/hooks/use-user"
import { useAllUsers } from "@/lib/queries/users.queries"
import { useInvoices, useInvoiceMutations, gbp } from "@/lib/queries/invoices.queries"
import { downloadInvoicePdf } from "@/lib/invoices/pdf"
import type { InvoiceItem, InvoiceStatus } from "@/types/database.types"

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  paid: "bg-success/15 text-success",
  void: "bg-destructive/15 text-destructive",
}

export default function InvoicesPage() {
  const { isAdmin, profile } = useUser()
  const { data, isLoading, isError, refetch } = useInvoices(isAdmin, profile?.id)
  const mut = useInvoiceMutations()
  const users = useAllUsers()

  const [open, setOpen] = useState(false)
  const [recipient, setRecipient] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unit_pence: 0 },
  ])

  const recipientUser = (users.data ?? []).find((u) => u.id === recipient)
  const total = items.reduce((s, i) => s + i.quantity * i.unit_pence, 0)

  function setItem(idx: number, patch: Partial<InvoiceItem>) {
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function create() {
    if (!recipient || !recipientUser || !profile?.id) {
      toast.error("Choose a recipient.")
      return
    }
    const valid = items.filter((i) => i.description.trim() && i.unit_pence >= 0)
    if (!valid.length) {
      toast.error("Add at least one line item.")
      return
    }
    mut.create
      .mutateAsync({
        recipientId: recipient,
        recipientName:
          recipientUser.full_name ||
          [recipientUser.first_name, recipientUser.last_name].filter(Boolean).join(" ") ||
          recipientUser.email,
        recipientEmail: recipientUser.email,
        items: valid,
        dueDate,
        notes,
        issuedBy: profile.id,
      })
      .then(() => {
        toast.success("Invoice issued")
        setOpen(false)
        setRecipient("")
        setDueDate("")
        setNotes("")
        setItems([{ description: "", quantity: 1, unit_pence: 0 }])
      })
      .catch(() => toast.error("Could not issue invoice"))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Invoices</h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin ? "Issue invoices to learners, trainers or staff." : "Your invoices."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> New invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-xs">Recipient</Label>
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a person" />
                    </SelectTrigger>
                    <SelectContent>
                      {(users.data ?? []).map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name ||
                            [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                            u.email}{" "}
                          · {u.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Line items</Label>
                  {items.map((it, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="Description"
                        value={it.description}
                        onChange={(e) => setItem(i, { description: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => setItem(i, { quantity: Number(e.target.value) || 1 })}
                        className="w-16"
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="£"
                        value={it.unit_pence ? it.unit_pence / 100 : ""}
                        onChange={(e) =>
                          setItem(i, { unit_pence: Math.round((Number(e.target.value) || 0) * 100) })
                        }
                        className="w-24"
                      />
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 shrink-0 text-muted-foreground"
                          onClick={() => setItems((a) => a.filter((_, x) => x !== i))}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setItems((a) => [...a, { description: "", quantity: 1, unit_pence: 0 }])
                    }
                  >
                    <Plus className="mr-1.5 size-4" /> Add line
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block text-xs">Due date</Label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  <div className="flex items-end justify-end">
                    <span className="text-sm">
                      Total: <span className="font-display text-lg">{gbp(total)}</span>
                    </span>
                  </div>
                </div>
                <Textarea
                  placeholder="Notes (optional)"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={create} disabled={mut.create.isPending}>
                  {mut.create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Issue invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load invoices.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Receipt className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Number</th>
                    {isAdmin && <th className="px-5 py-3 font-medium">Recipient</th>}
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Due</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {data!.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-mono text-xs">{inv.number}</td>
                      {isAdmin && <td className="px-5 py-3">{inv.recipient_name}</td>}
                      <td className="px-5 py-3">{gbp(inv.total_pence)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {inv.due_date ? format(new Date(inv.due_date), "d MMM yyyy") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary" className={STATUS_STYLE[inv.status]}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Download"
                            onClick={() => downloadInvoicePdf(inv)}
                          >
                            <Download className="size-4" />
                          </Button>
                          {isAdmin && inv.status !== "paid" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-success"
                              aria-label="Mark paid"
                              onClick={() =>
                                mut.setStatus
                                  .mutateAsync({ id: inv.id, status: "paid" })
                                  .then(() => toast.success("Marked paid"))
                                  .catch(() => toast.error("Could not update"))
                              }
                            >
                              <Check className="size-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
