import { Link } from "react-router-dom"
import { Plus, BookOpen, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data-table"
import { useCourses } from "@/lib/queries/courses.queries"
import { courseColumns } from "./columns"

export default function CoursesManagePage() {
  const { data, isLoading, isError, refetch } = useCourses()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Courses</h1>
          <p className="mt-1 text-muted-foreground">
            Build and manage your CSTF-aligned training catalogue.
          </p>
        </div>
        <Button asChild>
          <Link to="/platform/courses/builder">
            <Plus className="mr-2 size-4" /> New course
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-64" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load courses. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <BookOpen className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                No courses yet. Build your first course.
              </p>
              <Button asChild size="sm">
                <Link to="/platform/courses/builder">New course</Link>
              </Button>
            </div>
          ) : (
            <DataTable columns={courseColumns} data={data!} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
