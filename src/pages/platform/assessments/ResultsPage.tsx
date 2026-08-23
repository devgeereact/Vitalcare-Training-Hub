import { format } from "date-fns"
import { Download, AlertCircle, ClipboardList } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useResults } from "@/lib/queries/assessments.queries"

/** Load the 1.2MB spreadsheet library only when an export or import runs. */
async function loadXlsx() {
  return await import("xlsx")
}

export default function ResultsPage() {
  const { data, isLoading, isError, refetch } = useResults()

  async function exportXlsx() {
    if (!data?.length) return
    const XLSX = await loadXlsx()
    const rows = data.map((r) => ({
      Learner: r.learnerName,
      Assessment: r.assessmentTitle,
      "Score (%)": r.score,
      Result: r.passed ? "Pass" : "Fail",
      Completed: r.completedAt ? format(new Date(r.completedAt), "yyyy-MM-dd HH:mm") : "",
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Results")
    XLSX.writeFile(wb, "assessment-results.xlsx")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Assessment results</h1>
          <p className="mt-1 text-muted-foreground">
            Scores across all learner attempts.
          </p>
        </div>
        <Button variant="outline" onClick={exportXlsx} disabled={!data?.length}>
          <Download className="mr-2 size-4" /> Export XLSX
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
              <p className="text-sm text-muted-foreground">Could not load results.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <ClipboardList className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                No attempts recorded yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.learnerName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.assessmentTitle}</TableCell>
                    <TableCell>{r.score}%</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.passed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {r.passed ? "Pass" : "Fail"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.completedAt ? format(new Date(r.completedAt), "d MMM yyyy, HH:mm") : "-"}
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
