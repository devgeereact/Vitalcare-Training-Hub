import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"

import { DateRangePicker } from "@/components/ui/date-range-picker"
import {
  Wallet,
  AlertCircle,
  Plus,
  Loader2,
  Download,
  Trash2,
  Check,
  Eye,
  Printer,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import { useAllUsers } from "@/lib/queries/users.queries"
import { usePayroll, usePayrollMutations, gbp } from "@/lib/queries/payroll.queries"
import { downloadPayslipPdf } from "@/lib/payroll/payslip"
import { PayslipView } from "@/components/payroll/PayslipView"
import "@/lib/invoices/print.css"
import type { Payroll, PayrollStatus } from "@/types/database.types"

const STATUS_STYLE: Record<PayrollStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-primary/10 text-primary",
  paid: "bg-success/15 text-success",
}

const EMPLOYEE_ROLES = new Set(["trainer", "admin", "super_admin", "manager", "content_editor"])

function poundsToPence(v: string): number {
  return Math.round((Number(v) || 0) * 100)
}

export default function PayrollPage() {
  const { isAdmin, profile } = useUser()
  const q = usePayroll(isAdmin, profile?.id)
  const mut = usePayrollMutations()
  const users = useAllUsers()

  const [open, setOpen] = useState(false)
  const [viewing, setViewing] = useState<Payroll | null>(null)
  const [searchParams] = useSearchParams()

  // Deep link from a notification (?id=) opens that payslip.
  useEffect(() => {
    const id = searchParams.get("id")
    if (!id) return
    const match = (q.data ?? []).find((p) => p.id === id)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- open the item from a URL deep link
    if (match) setViewing(match)
  }, [searchParams, q.data])
  const [staffId, setStaffId] = useState("")
  const [period, setPeriod] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [gross, setGross] = useState("")
  const [deductions, setDeductions] = useState("")
  const [notes, setNotes] = useState("")

  const employees = (users.data ?? []).filter((u) => EMPLOYEE_ROLES.has(u.role))
  const staffUser = employees.find((u) => u.id === staffId)
  const grossPence = poundsToPence(gross)
  const dedPence = poundsToPence(deductions)
  const netPence = Math.max(0, grossPence - dedPence)

  const rows = q.data ?? []
  const totalNet = rows.reduce((s, p) => s + p.net_pence, 0)
  const paidNet = rows.filter((p) => p.status === "paid").reduce((s, p) => s + p.net_pence, 0)

  function reset() {
    setStaffId("")
    setPeriod("")
    setPeriodStart("")
    setPeriodEnd("")
    setGross("")
    setDeductions("")
    setNotes("")
  }

  function create() {
    if (!staffId || !staffUser || !profile?.id) {
      toast.error("Choose an employee.")
      return
    }
    if (!period.trim()) {
      toast.error("Add a pay period.")
      return
    }
    mut.create
      .mutateAsync({
        staffId,
        staffName:
          staffUser.full_name ||
          [staffUser.first_name, staffUser.last_name].filter(Boolean).join(" ") ||
          staffUser.email,
        staffEmail: staffUser.email,
        period: period.trim(),
        periodStart: periodStart || null,
        periodEnd: periodEnd || null,
        grossPence,
        deductionsPence: dedPence,
        notes: notes.trim() || null,
        issuedBy: profile.id,
      })
      .then(() => {
        toast.success("Payslip created")
        setOpen(false)
        reset()
      })
      .catch(() => toast.error("Could not create payslip"))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Payroll</h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin ? "Create and manage staff payslips." : "Your payslips."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> New payslip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New payslip</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-xs">Employee</Label>
                  <Select value={staffId} onValueChange={setStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((u) => (
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

                <div>
                  <Label className="mb-1.5 block text-xs">Pay period</Label>
                  <Input
                    placeholder="e.g. June 2025"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs">Period dates</Label>
                  <DateRangePicker
                    className="w-full"
                    value={{
                      from: periodStart ? new Date(periodStart) : undefined,
                      to: periodEnd ? new Date(periodEnd) : undefined,
                    }}
                    onChange={(range) => {
                      setPeriodStart(range?.from ? format(range.from, "yyyy-MM-dd") : "")
                      setPeriodEnd(range?.to ? format(range.to, "yyyy-MM-dd") : "")
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block text-xs">Gross pay (£)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={gross}
                      onChange={(e) => setGross(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs">Deductions (£)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={deductions}
                      onChange={(e) => setDeductions(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md bg-muted px-3 py-2 text-sm">
                  Net pay: <span className="font-display text-lg">{gbp(netPence)}</span>
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
                  Create payslip
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary */}
      {!q.isLoading && !q.isError && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="font-display text-2xl">{rows.length}</p>
              <p className="text-xs text-muted-foreground">Payslips</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="font-display text-2xl">{gbp(totalNet)}</p>
              <p className="text-xs text-muted-foreground">Total net</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="font-display text-2xl">{gbp(paidNet)}</p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : q.isError ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load payroll.</p>
              <Button variant="outline" size="sm" onClick={() => q.refetch()}>
                Retry
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Wallet className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "No payslips yet." : "You have no payslips yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    {isAdmin && <th className="px-5 py-3 font-medium">Employee</th>}
                    <th className="px-5 py-3 font-medium">Period</th>
                    <th className="px-5 py-3 font-medium">Gross</th>
                    <th className="px-5 py-3 font-medium">Deductions</th>
                    <th className="px-5 py-3 font-medium">Net</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      {isAdmin && <td className="px-5 py-3">{p.staff_name}</td>}
                      <td className="px-5 py-3">{p.period}</td>
                      <td className="px-5 py-3">{gbp(p.gross_pence)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{gbp(p.deductions_pence)}</td>
                      <td className="px-5 py-3 font-medium">{gbp(p.net_pence)}</td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary" className={cn("capitalize", STATUS_STYLE[p.status])}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Preview payslip"
                            onClick={() => setViewing(p)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Download payslip"
                            onClick={() => downloadPayslipPdf(p)}
                          >
                            <Download className="size-4" />
                          </Button>
                          {isAdmin && p.status !== "paid" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-success"
                              aria-label="Mark paid"
                              onClick={() =>
                                mut.setStatus
                                  .mutateAsync({ id: p.id, status: "paid" })
                                  .then(() => toast.success("Marked paid"))
                                  .catch(() => toast.error("Could not update"))
                              }
                            >
                              <Check className="size-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              aria-label="Delete"
                              onClick={() => {
                                if (!confirm(`Delete payslip for ${p.staff_name}?`)) return
                                mut.remove
                                  .mutateAsync(p.id)
                                  .then(() => toast.success("Deleted"))
                                  .catch(() => toast.error("Could not delete"))
                              }}
                            >
                              <Trash2 className="size-4" />
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

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle>
              Payslip {viewing ? `· ${viewing.period}` : ""}
            </DialogTitle>
          </DialogHeader>
          {viewing && <PayslipView payslip={viewing} />}
          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => viewing && downloadPayslipPdf(viewing)}>
              <Download className="mr-2 size-4" /> Download PDF
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 size-4" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
