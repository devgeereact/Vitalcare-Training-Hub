import { format } from "date-fns"
import { Star, AlertCircle, TrendingUp, MessageSquareText } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useFeedbackResults } from "@/lib/queries/feedback.queries"

export default function FeedbackResultsPage() {
  const { data, isLoading, isError, refetch } = useFeedbackResults()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Feedback &amp; NPS</h1>
        <p className="mt-1 text-muted-foreground">
          Learner satisfaction and Net Promoter Score across your training.
        </p>
      </div>

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
            <p className="text-sm text-muted-foreground">
              No feedback submitted yet.
            </p>
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
                  <p className="font-display text-2xl text-foreground">
                    {data!.avgRating}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg rating / 5</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="font-display text-2xl text-success">{data!.promoters}</p>
                <p className="text-xs text-muted-foreground">Promoters (9–10)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="font-display text-2xl text-destructive">
                  {data!.detractors}
                </p>
                <p className="text-xs text-muted-foreground">Detractors (0–6)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent comments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {data!.recent
                  .filter((r) => r.comment)
                  .map((r) => (
                    <li key={r.id} className="px-5 py-3">
                      <div className="mb-1 flex items-center gap-3">
                        <span className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "size-3.5",
                                i < (r.rating ?? 0)
                                  ? "fill-brand-gold text-brand-gold"
                                  : "text-muted-foreground",
                              )}
                            />
                          ))}
                        </span>
                        {r.nps !== null && (
                          <span className="text-xs text-muted-foreground">
                            NPS {r.nps}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {format(new Date(r.created_at), "d MMM yyyy")}
                        </span>
                      </div>
                      <p className="text-sm">{r.comment}</p>
                    </li>
                  ))}
              </ul>
              {data!.recent.filter((r) => r.comment).length === 0 && (
                <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                  No written comments yet.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
