import { Link } from "react-router-dom"
import { format } from "date-fns"
import { Plus, ClipboardCheck, AlertCircle, Pencil, PlayCircle } from "lucide-react"
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
import { useAssessments } from "@/lib/queries/assessments.queries"

export default function QuizListPage() {
  const { data, isLoading, isError, refetch } = useAssessments()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Quiz builder</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage assessments and question banks.
          </p>
        </div>
        <Button asChild>
          <Link to="/platform/assessments/builder/new">
            <Plus className="mr-2 size-4" /> New assessment
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load assessments.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <ClipboardCheck className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">No assessments yet.</p>
              <Button asChild size="sm">
                <Link to="/platform/assessments/builder/new">New assessment</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Pass mark</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/platform/assessments/builder/${a.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {a.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.courseTitle}</TableCell>
                    <TableCell>{a.passMark}%</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.status === "Published"
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {a.status}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(a.updatedAt), "d MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" className="size-8" aria-label="Take">
                          <Link to={`/platform/assessments/${a.id}`}>
                            <PlayCircle className="size-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="size-8" aria-label="Edit">
                          <Link to={`/platform/assessments/builder/${a.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                      </div>
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
