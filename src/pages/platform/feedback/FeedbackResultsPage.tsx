import type { ReactNode } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Star,
  AlertCircle,
  TrendingUp,
  MessageSquareText,
  Check,
  X,
  Clock,
  Globe,
  BookOpen,
  ThumbsUp,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import {
  useFeedbackResults,
  useModerateFeedback,
  type FeedbackRow,
  type FeedbackSource,
} from "@/lib/queries/feedback.queries"
import CommsShell from "@/components/communication/CommsShell"

const SOURCE_META: Record<FeedbackSource, { label: string; icon: typeof Globe; cls: string }> = {
  website: { label: "Website", icon: Globe, cls: "bg-primary/10 text-primary" },
  course: { label: "Course", icon: BookOpen, cls: "bg-brand-navy/10 text-brand-navy" },
  recommendation: {
    label: "Recommendation",
    icon: ThumbsUp,
    cls: "bg-success/15 text-success",
  },
}

function Stars({ value }: { value: number }): ReactNode {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < value ? "fill-brand-gold text-brand-gold" : "text-muted-foreground",
          )}
        />
      ))}
    </span>
  )
}

function FeedbackCard({
  row,
  children,
}: {
  row: FeedbackRow
  children?: React.ReactNode
}): ReactNode {
  const meta = SOURCE_META[row.source] ?? SOURCE_META.course
  const Icon = meta.icon
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Stars value={row.rating ?? 0} />
          {row.nps !== null && (
            <span className="text-xs text-muted-foreground">NPS {row.nps}</span>
          )}
          <Badge variant="secondary" className={cn("gap-1", meta.cls)}>
            <Icon className="size-3" /> {meta.label}
          </Badge>
          <span className="ml-auto text-xs text-muted-foreground">
            {format(new Date(row.created_at), "d MMM yyyy")}
          </span>
        </div>
        {row.comment ? (
          <p className="text-sm text-foreground">{row.comment}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No written comment.</p>
        )}
        <p className="text-xs text-muted-foreground">
          {row.author_name ? row.author_name : "Anonymous"}
        </p>
        {children}
      </CardContent>
    </Card>
  )
}

export default function FeedbackResultsPage(): ReactNode {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useFeedbackResults()
  const moderate = useModerateFeedback(user?.id)

  function decide(id: string, decision: "approved" | "rejected"): void {
    moderate
      .mutateAsync({ id, decision })
      .then(() => toast.success(decision === "approved" ? "Published" : "Rejected"))
      .catch(() => toast.error("Could not update. Please try again."))
  }

  return (
    <CommsShell subtitle="Approve submissions to publish them. Scores are calculated from published feedback only.">
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load feedback. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : data!.total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <MessageSquareText className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
                  <TrendingUp className="size-5" />
                </span>
                <div>
                  <p className="font-display text-2xl text-foreground">{data!.npsScore}</p>
                  <p className="text-xs text-muted-foreground">NPS score</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-gold/20 text-brand-gold">
                  <Star className="size-5" />
                </span>
                <div>
                  <p className="font-display text-2xl text-foreground">{data!.avgRating}</p>
                  <p className="text-xs text-muted-foreground">Avg rating / 5</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="font-display text-2xl text-success">{data!.approved}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="font-display text-2xl text-warning">{data!.pending}</p>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
          </div>

          {/* Approval queue */}
          {data!.awaiting.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-warning" />
                <h2 className="font-display text-lg text-foreground">Awaiting approval</h2>
                <Badge variant="secondary">{data!.awaiting.length}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {data!.awaiting.map((row) => (
                  <FeedbackCard key={row.id} row={row}>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => decide(row.id, "approved")}
                        disabled={moderate.isPending}
                      >
                        <Check className="mr-1.5 size-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decide(row.id, "rejected")}
                        disabled={moderate.isPending}
                      >
                        <X className="mr-1.5 size-4" /> Reject
                      </Button>
                    </div>
                  </FeedbackCard>
                ))}
              </div>
            </section>
          )}

          {/* Published */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-success" />
              <h2 className="font-display text-lg text-foreground">Published feedback</h2>
            </div>
            {data!.published.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Nothing published yet. Approve a submission above to feature it.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data!.published.map((row) => (
                  <FeedbackCard key={row.id} row={row} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </CommsShell>
  )
}
