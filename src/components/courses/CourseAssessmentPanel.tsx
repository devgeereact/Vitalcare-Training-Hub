import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Plus, Pencil, ClipboardCheck, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"

interface CourseAssessment {
  id: string
  title: string
  pass_mark: number
  is_published: boolean
}

function useCourseAssessments(courseId: string) {
  return useQuery({
    queryKey: ["course-assessments", courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<CourseAssessment[]> => {
      const { data, error } = await supabase
        .from("assessments")
        .select("id, title, pass_mark, is_published")
        .eq("course_id", courseId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
      if (error) {
        console.error("[useCourseAssessments]", error)
        throw error
      }
      return (data ?? []) as CourseAssessment[]
    },
  })
}

/**
 * The Assessment stage of the course builder. Lists the quizzes linked to this
 * course and links straight into the Quiz Builder, pre-linked to the course so
 * the two builders stay joined up.
 */
export default function CourseAssessmentPanel({ courseId }: { courseId: string }) {
  const assessments = useCourseAssessments(courseId)

  return (
    <div className="space-y-4">
      {assessments.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
        </div>
      ) : assessments.isError ? (
        <div className="py-6 text-center">
          <AlertCircle className="mx-auto size-7 text-destructive" />
          <p className="mt-2 text-sm text-muted-foreground">Could not load assessments.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => assessments.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (assessments.data?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-8 text-center">
          <ClipboardCheck className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No assessment yet. Learners need one to earn the certificate.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link to={`/platform/assessments/builder/new?course=${courseId}`}>
              <Plus className="mr-1.5 size-4" /> Create assessment
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {assessments.data!.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <ClipboardCheck className="size-4 shrink-0 text-brand-navy" />
              <span className="truncate text-sm font-medium">{a.title}</span>
              <Badge variant="outline" className="text-[10px]">
                Pass {a.pass_mark}%
              </Badge>
              <Badge
                variant="outline"
                className={
                  a.is_published
                    ? "text-[10px] border-success/30 bg-success/10 text-success"
                    : "text-[10px]"
                }
              >
                {a.is_published ? "Published" : "Draft"}
              </Badge>
              <Button asChild variant="outline" size="sm" className="ml-auto">
                <Link to={`/platform/assessments/builder/${a.id}`}>
                  <Pencil className="mr-1.5 size-4" /> Edit questions
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {(assessments.data?.length ?? 0) > 0 && (
        <Button asChild variant="ghost" size="sm">
          <Link to={`/platform/assessments/builder/new?course=${courseId}`}>
            <Plus className="mr-1.5 size-4" /> Add another assessment
          </Link>
        </Button>
      )}
    </div>
  )
}
