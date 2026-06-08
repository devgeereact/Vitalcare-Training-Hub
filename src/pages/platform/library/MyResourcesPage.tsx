import { useMemo } from "react"
import { Link } from "react-router-dom"
import { FolderOpen, Download, FileText, AlertCircle, BookOpen } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useMyResources, type CourseResource } from "@/lib/queries/library.queries"
import { useUser } from "@/hooks/use-user"

/**
 * Learner-facing resources. Shows the materials for the courses the user is
 * enrolled on, grouped by course. RLS (migration 065) already restricts a
 * learner to learner/both resources on their enrolled courses, and trainers to
 * their own; this page just presents what the user is allowed to see.
 */
export default function MyResourcesPage() {
  const { isLearner, isGuest } = useUser()
  const audience = isLearner || isGuest ? "learner" : "trainer"
  const resources = useMyResources(audience)

  // Group resources by course; general (course-less) resources go last.
  const groups = useMemo(() => {
    const byCourse = new Map<string, { title: string; items: CourseResource[] }>()
    for (const r of resources.data ?? []) {
      const key = r.courseId ?? "__general__"
      const title = r.courseId ? r.courseTitle ?? "Course" : "General resources"
      if (!byCourse.has(key)) byCourse.set(key, { title, items: [] })
      byCourse.get(key)!.items.push(r)
    }
    return [...byCourse.entries()]
      .map(([key, g]) => ({ key, ...g }))
      .sort((a, b) => (a.key === "__general__" ? 1 : b.key === "__general__" ? -1 : a.title.localeCompare(b.title)))
  }, [resources.data])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl text-foreground">
          <FolderOpen className="size-6 text-brand-navy" /> Resources
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workbooks, handouts and materials for the courses you are enrolled on.
        </p>
      </div>

      {resources.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : resources.isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Could not load your resources.</p>
          <Button variant="outline" size="sm" onClick={() => resources.refetch()}>
            Retry
          </Button>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <BookOpen className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No resources yet. Enrol on a course and its materials appear here.
          </p>
          <Button asChild size="sm">
            <Link to="/platform/courses">Browse courses</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <Card key={g.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <BookOpen className="size-5 text-brand-navy" /> {g.title}
                </CardTitle>
                <CardDescription>
                  {g.items.length} resource{g.items.length === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {g.items.map((r) => (
                    <li key={r.id}>
                      <a
                        href={r.fileUrl || r.linkUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted"
                      >
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                          {r.description && (
                            <p className="truncate text-xs text-muted-foreground">{r.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-auto text-[10px] capitalize">
                          {r.kind}
                        </Badge>
                        <Download className="size-4 shrink-0 text-muted-foreground" />
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
