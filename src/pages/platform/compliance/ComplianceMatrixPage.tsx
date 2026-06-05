import { useState, type JSX } from "react"
import { AlertCircle, ClipboardList, ShieldCheck } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/hooks/use-user"
import {
  useStaffMatrix,
  type ComplianceStatus,
  type MatrixCell,
} from "@/lib/queries/compliance.queries"
import RecordTrainingDialog, {
  type RecordTarget,
} from "@/components/compliance/RecordTrainingDialog"
import RequirementsDialog from "@/components/compliance/RequirementsDialog"

const STATUS_META: Record<
  ComplianceStatus,
  { label: string; className: string }
> = {
  current: { label: "Current", className: "bg-success/15 text-success" },
  due_soon: { label: "Due soon", className: "bg-warning/15 text-warning" },
  overdue: { label: "Overdue", className: "bg-destructive/15 text-destructive" },
  not_recorded: { label: "Not recorded", className: "bg-muted text-muted-foreground" },
}

function StatusChip({ cell }: { cell: MatrixCell }): JSX.Element {
  const meta = STATUS_META[cell.status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}
      title={cell.dueOn ? `Due ${cell.dueOn}` : undefined}
    >
      {meta.label}
    </span>
  )
}

export default function ComplianceMatrixPage(): JSX.Element {
  const matrix = useStaffMatrix()
  const { isAdmin, isSuperAdmin, isManager } = useUser()
  const canManage = isAdmin || isSuperAdmin || isManager

  const [target, setTarget] = useState<RecordTarget | null>(null)
  const [reqOpen, setReqOpen] = useState(false)

  const courses = matrix.data?.courses ?? []
  const staff = matrix.data?.staff ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">
            Training compliance
          </h1>
          <p className="mt-1 text-muted-foreground">
            Mandatory training status for every staff member, with renewal dates
            tracked automatically.
          </p>
        </div>
        {canManage && (
          <Button variant="outline" onClick={() => setReqOpen(true)}>
            <ClipboardList className="mr-2 size-4" />
            Manage requirements
          </Button>
        )}
      </div>

      {matrix.isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : matrix.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load the compliance matrix.
            </p>
            <Button variant="outline" size="sm" onClick={() => matrix.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ShieldCheck className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No mandatory courses set yet. Add the courses your staff must hold
              to start tracking compliance.
            </p>
            {canManage && (
              <Button size="sm" onClick={() => setReqOpen(true)}>
                Manage requirements
              </Button>
            )}
          </CardContent>
        </Card>
      ) : staff.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No staff to show.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left font-semibold">
                    Staff member
                  </th>
                  {courses.map((c) => (
                    <th
                      key={c.courseId}
                      className="px-4 py-3 text-left font-semibold"
                    >
                      {c.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium">
                      {s.name}
                    </td>
                    {courses.map((c) => {
                      const cell = s.cells[c.courseId]
                      const chip = <StatusChip cell={cell} />
                      return (
                        <td key={c.courseId} className="px-4 py-3">
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() =>
                                setTarget({
                                  staffId: s.id,
                                  staffName: s.name,
                                  courseId: c.courseId,
                                  courseTitle: c.title,
                                  renewalMonths: c.renewalMonths,
                                })
                              }
                              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                              title="Record training"
                            >
                              {chip}
                            </button>
                          ) : (
                            chip
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <RecordTrainingDialog target={target} onClose={() => setTarget(null)} />
      <RequirementsDialog open={reqOpen} onClose={() => setReqOpen(false)} />
    </div>
  )
}
