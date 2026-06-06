import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Sparkles, Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { generateAndPersistCourse } from "@/lib/ai/generate-course"

/**
 * One-shot AI course generation. Enter a course name and the assistant builds
 * the details, curriculum, assessment and the three documents (Full Course,
 * Learner Workbook, Trainer Workbook), then drops you into the builder to
 * review and publish.
 */
export default function AiCourseGenerator() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState("")

  async function generate() {
    if (!name.trim()) {
      toast.error("Enter a course name first")
      return
    }
    setBusy(true)
    try {
      const id = await generateAndPersistCourse(name.trim(), setStep)
      toast.success("Course generated", {
        description: "Details, curriculum, assessment and workbooks are ready. Review and publish.",
      })
      navigate(`/platform/courses/builder/${id}`)
    } catch (err) {
      console.error("[AiCourseGenerator]", err)
      toast.error("Generation failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
    } finally {
      setBusy(false)
      setStep("")
    }
  }

  return (
    <Card className="border-brand-gold/40 bg-brand-gold/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl">
          <Sparkles className="size-5 text-brand-gold" /> Generate a full course with AI
        </CardTitle>
        <CardDescription>
          Enter a course name. The assistant builds the details, curriculum, assessment,
          and the Learner and Trainer Workbooks in one go, then opens the builder for review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="e.g. Moving and Handling, Basic Life Support, Safeguarding Adults"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter") generate()
            }}
          />
          <Button onClick={generate} disabled={busy || !name.trim()} className="shrink-0">
            {busy ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 size-4" />
            )}
            {busy ? "Generating…" : "Generate course"}
          </Button>
        </div>
        {busy && step && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> {step}…
          </p>
        )}
        {busy && (
          <p className="text-xs text-muted-foreground">
            This takes a minute or two. Keep this tab open.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
