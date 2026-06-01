import { Link } from "react-router-dom"
import { UserPlus, Upload, Users, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data-table"
import { useLearners } from "@/lib/queries/learners.queries"
import { learnerColumns } from "./columns"
import ImportLearnersDialog from "./ImportLearnersDialog"

export default function LearnersListPage() {
  const { data, isLoading, isError, refetch } = useLearners()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Learners</h1>
          <p className="mt-1 text-muted-foreground">
            Manage everyone enrolled on your training programmes.
          </p>
        </div>
        <div className="flex gap-2">
          <ImportLearnersDialog>
            <Button variant="outline">
              <Upload className="mr-2 size-4" /> Import
            </Button>
          </ImportLearnersDialog>
          <Button asChild>
            <Link to="/platform/learners/new">
              <UserPlus className="mr-2 size-4" /> Add learner
            </Link>
          </Button>
        </div>
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
                Could not load learners. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Users className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                No learners yet. Add your first learner or import a list.
              </p>
              <Button asChild size="sm">
                <Link to="/platform/learners/new">Add learner</Link>
              </Button>
            </div>
          ) : (
            <DataTable columns={learnerColumns} data={data!} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
