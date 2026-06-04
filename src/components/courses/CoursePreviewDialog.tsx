import { Award, BookOpen, Clock, Layers, ShieldCheck } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCourseDuration } from "@/lib/utils"
import { driveImageUrl } from "@/lib/drive-image"
import { useCurriculum } from "@/lib/queries/courses.queries"

export interface CoursePreviewValues {
  title: string
  summary: string
  description: string
  cpdHours: number
  durationMins: number
  cstf: boolean
  thumbnailUrl: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Course id when editing; preview reads its saved curriculum. */
  courseId?: string
  values: CoursePreviewValues
}

/**
 * Learner-facing preview of the course being authored, built from the current
 * form values plus the saved curriculum. Lets authors see how a course reads
 * before publishing. Curriculum reflects the last save.
 */
export default function CoursePreviewDialog({
  open,
  onOpenChange,
  courseId,
  values,
}: Props): React.JSX.Element {
  const curriculum = useCurriculum(courseId ?? "")
  const modules = curriculum.data ?? []
  const lessonCount = modules.reduce((sum, m) => sum + m.lessons.length, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Course preview</DialogTitle>
          <DialogDescription>How this course appears to learners.</DialogDescription>
        </DialogHeader>

        {values.thumbnailUrl && (
          <img
            src={driveImageUrl(values.thumbnailUrl, 800)}
            alt=""
            className="aspect-video w-full rounded-xl object-cover"
          />
        )}

        <h1 className="font-display text-2xl leading-tight text-brand-navy">
          {values.title || "Untitled course"}
        </h1>
        {values.summary && (
          <p className="text-sm text-muted-foreground">{values.summary}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {values.cstf && (
            <Badge
              variant="outline"
              className="gap-1 border-success/30 bg-success/10 text-success"
            >
              <ShieldCheck className="size-3.5" /> CSTF aligned
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Award className="size-3.5 text-brand-gold" /> {values.cpdHours}h CPD
          </Badge>
          {values.durationMins > 0 && (
            <Badge variant="outline" className="gap-1">
              <Clock className="size-3.5 text-brand-gold" />
              {formatCourseDuration(values.durationMins)}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Layers className="size-3.5 text-brand-gold" /> {modules.length} modules
          </Badge>
          <Badge variant="outline" className="gap-1">
            <BookOpen className="size-3.5 text-brand-gold" /> {lessonCount} lessons
          </Badge>
        </div>

        {values.description && (
          <div
            className="prose prose-sm max-w-none text-foreground [&_a]:text-brand-navy"
            // Description is author-entered rich text stored as HTML.
            dangerouslySetInnerHTML={{ __html: values.description }}
          />
        )}

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">
            What you will cover
          </h2>
          {curriculum.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No curriculum yet. Add modules and lessons, then save to preview them.
            </p>
          ) : (
            <ol className="space-y-3">
              {modules.map((m, i) => (
                <li key={m.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {i + 1}. {m.title}
                  </p>
                  {m.lessons.length > 0 && (
                    <ul className="mt-1.5 space-y-1 pl-4">
                      {m.lessons.map((l) => (
                        <li
                          key={l.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <BookOpen className="size-3.5 shrink-0" /> {l.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
