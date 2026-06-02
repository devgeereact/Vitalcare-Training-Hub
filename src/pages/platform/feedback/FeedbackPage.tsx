import { useState } from "react"
import { toast } from "sonner"
import { Star, Loader2, CheckCircle2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useSubmitFeedback, type FeedbackSource } from "@/lib/queries/feedback.queries"

const SOURCES: { value: FeedbackSource; label: string }[] = [
  { value: "course", label: "About a course" },
  { value: "website", label: "About the website" },
  { value: "recommendation", label: "A recommendation" },
]

export default function FeedbackPage() {
  const { user } = useAuth()
  const submit = useSubmitFeedback(user?.id)
  const [source, setSource] = useState<FeedbackSource>("course")
  const [name, setName] = useState("")
  const [nps, setNps] = useState<number | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [done, setDone] = useState(false)

  function send() {
    if (nps === null || rating === 0) {
      toast.error("Please choose a score and a star rating.")
      return
    }
    submit
      .mutateAsync({ nps, rating, comment, source, authorName: name })
      .then(() => setDone(true))
      .catch(() => toast.error("Could not submit. Please try again."))
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <CheckCircle2 className="size-10 text-success" />
            <p className="font-display text-xl text-foreground">Thank you</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your feedback has been received. An administrator reviews each submission
              before it is published, so it helps us improve the training we deliver.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Share your feedback</h1>
        <p className="mt-1 text-muted-foreground">
          A few quick questions and any comments you would like to add.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About your feedback</CardTitle>
          <CardDescription>Tell us what this relates to.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Type</Label>
            <Select value={source} onValueChange={(v) => setSource(v as FeedbackSource)}>
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Your name (optional)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should we credit this feedback?"
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How likely are you to recommend us?</CardTitle>
          <CardDescription>0 = not likely, 10 = extremely likely</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 11 }).map((_, n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNps(n)}
                className={cn(
                  "size-10 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                  nps === n
                    ? "border-brand-navy bg-brand-navy text-white"
                    : "border-border hover:bg-muted",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overall rating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const v = i + 1
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRating(v)}
                  aria-label={`${v} star`}
                  className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  <Star
                    className={cn(
                      "size-8",
                      v <= rating ? "fill-brand-gold text-brand-gold" : "text-muted-foreground",
                    )}
                  />
                </button>
              )
            })}
          </div>
          <Textarea
            placeholder="Anything you would like to add? (optional)"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={send} disabled={submit.isPending}>
              {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
