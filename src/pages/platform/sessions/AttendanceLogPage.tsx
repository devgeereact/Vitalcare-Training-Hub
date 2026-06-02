import { format } from "date-fns"
import { ClipboardList, AlertCircle, Download } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAttendanceLog } from "@/lib/queries/sessions.queries"
import type { AttendanceLogRow } from "@/lib/queries/sessions.queries"

/** Quote a CSV cell, escaping any embedded quotes per RFC 4180. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function exportAttendanceCsv(rows: AttendanceLogRow[]): void {
  const header = ["Learner", "Session", "Status", "Marked at"]
  const lines = rows.map((r) =>
    [
      csvCell(r.learnerName),
      csvCell(r.sessionTitle),
      csvCell(r.status),
      csvCell(r.markedAt ? format(new Date(r.markedAt), "yyyy-MM-dd HH:mm") : ""),
    ].join(","),
  )
  const csv = [header.map(csvCell).join(","), ...lines].join("\r\n")
  // Prepend BOM so Excel reads UTF-8 correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `attendance-log-${format(new Date(), "yyyy-MM-dd")}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const STATUS_CLS: Record<string, string> = {
  present: "bg-success/15 text-success",
  late: "bg-warning/15 text-warning",
  excused: "bg-primary/10 text-primary",
  absent: "bg-destructive/15 text-destructive",
}

export default function AttendanceLogPage() {
  const { data, isLoading, isError, refetch } = useAttendanceLog()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Attendance log</h1>
          <p className="mt-1 text-muted-foreground">
            Every attendance record across all sessions.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={(data?.length ?? 0) === 0}
          onClick={() => {
            if (!data || data.length === 0) return
            try {
              exportAttendanceCsv(data)
              toast.success(`Exported ${data.length} record${data.length === 1 ? "" : "s"}`)
            } catch {
              toast.error("Could not export the log. Please try again.")
            }
          }}
        >
          <Download className="mr-2 size-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load attendance.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <ClipboardList className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Marked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.learnerName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.sessionTitle}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          STATUS_CLS[r.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.markedAt ? format(new Date(r.markedAt), "d MMM yyyy, HH:mm") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
