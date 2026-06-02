import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Star, Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useReviews, useSubmitReview } from "@/lib/queries/course-extras.queries"

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < Math.round(value)
              ? "fill-brand-gold text-brand-gold"
              : "text-muted-foreground",
          )}
        />
      ))}
    </span>
  )
}

export default function CourseReviews({ courseId }: { courseId: string }) {
  const { user } = useAuth()
  const { data, isLoading } = useReviews(courseId, user?.id)
  const submit = useSubmitReview(courseId, user?.id)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")

  function send() {
    if (rating === 0) {
      toast.error("Choose a star rating.")
      return
    }
    submit
      .mutateAsync({ rating, comment })
      .then(() => {
        toast.success("Thanks for your review")
        setComment("")
        setRating(0)
      })
      .catch(() => toast.error("Could not submit. Please try again."))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Reviews</CardTitle>
          {!isLoading && (data?.count ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Stars value={data!.average} />
              <span className="font-medium">{data!.average}</span>
              <span className="text-muted-foreground">({data!.count})</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Submit / edit own review */}
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {data?.mine ? "Update your review" : "Leave a review"}
            </span>
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => {
                const v = i + 1
                const active = (rating || data?.mine?.rating || 0) >= v
                return (
                  <button
                    key={v}
                    type="button"
                    aria-label={`${v} star`}
                    onClick={() => setRating(v)}
                    className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                  >
                    <Star
                      className={cn(
                        "size-5",
                        active ? "fill-brand-gold text-brand-gold" : "text-muted-foreground",
                      )}
                    />
                  </button>
                )
              })}
            </span>
          </div>
          <Textarea
            rows={2}
            placeholder="Optional comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={send} disabled={submit.isPending}>
              {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {data?.mine ? "Update" : "Submit"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (data?.reviews.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first.</p>
        ) : (
          <ul className="space-y-3">
            {data!.reviews.map((r) => (
              <li key={r.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{r.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "d MMM yyyy")}
                  </span>
                </div>
                <Stars value={r.rating} className="my-1" />
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
