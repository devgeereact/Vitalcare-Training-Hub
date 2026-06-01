import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { QuestionFormValues } from "@/lib/validations/assessment.schema"
import type { QuestionType } from "@/types/database.types"

type Opt = { label: string; is_correct: boolean }

const TYPES = [
  { value: "mcq", label: "Multiple choice" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the blank" },
  { value: "free_text", label: "Essay (manual grade)" },
] as const

export default function QuestionDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  saving,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: QuestionFormValues
  onSubmit: (values: QuestionFormValues) => void
  saving?: boolean
}) {
  // Lazy-initialised from `initial`. The parent remounts this dialog (via key)
  // each time it opens, so a one-time initial state is correct here.
  const [type, setType] = useState<QuestionType>(initial?.type ?? "mcq")
  const [prompt, setPrompt] = useState(initial?.prompt ?? "")
  const [points, setPoints] = useState(initial?.points ?? 1)
  const [options, setOptions] = useState<Opt[]>(
    initial?.type === "mcq" && initial.options.length
      ? initial.options
      : [
          { label: "", is_correct: false },
          { label: "", is_correct: false },
        ],
  )
  const [tfCorrect, setTfCorrect] = useState(
    initial?.type === "true_false"
      ? initial.options.find((o) => o.is_correct)?.label === "True"
      : true,
  )
  const [fillAnswer, setFillAnswer] = useState(
    initial?.type === "fill_blank" ? initial.options[0]?.label ?? "" : "",
  )
  const [error, setError] = useState("")

  function buildOptions(): Opt[] {
    if (type === "mcq") return options.filter((o) => o.label.trim())
    if (type === "true_false")
      return [
        { label: "True", is_correct: tfCorrect },
        { label: "False", is_correct: !tfCorrect },
      ]
    if (type === "fill_blank") return [{ label: fillAnswer.trim(), is_correct: true }]
    return []
  }

  function handleSave() {
    if (prompt.trim().length < 3) return setError("Enter the question text")
    const opts = buildOptions()
    if (type === "mcq" && (opts.length < 2 || !opts.some((o) => o.is_correct)))
      return setError("Add 2+ options and mark at least one correct")
    if (type === "fill_blank" && !fillAnswer.trim())
      return setError("Enter the accepted answer")
    onSubmit({ type, prompt: prompt.trim(), points, options: opts })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {initial ? "Edit question" : "Add question"}
          </DialogTitle>
          <DialogDescription>Build a question for this assessment.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Points</Label>
              <Input
                type="number"
                min={1}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Question</Label>
            <Textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What does CSTF stand for?"
            />
          </div>

          {type === "mcq" && (
            <div className="space-y-2">
              <Label>Options (tick correct)</Label>
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox
                    checked={o.is_correct}
                    onCheckedChange={(c) =>
                      setOptions((prev) =>
                        prev.map((p, j) => (j === i ? { ...p, is_correct: !!c } : p)),
                      )
                    }
                  />
                  <Input
                    value={o.label}
                    placeholder={`Option ${i + 1}`}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((p, j) => (j === i ? { ...p, label: e.target.value } : p)),
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-destructive"
                    aria-label="Remove option"
                    onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOptions((prev) => [...prev, { label: "", is_correct: false }])}
              >
                <Plus className="mr-1.5 size-4" /> Add option
              </Button>
            </div>
          )}

          {type === "true_false" && (
            <div className="space-y-1.5">
              <Label>Correct answer</Label>
              <Select value={tfCorrect ? "true" : "false"} onValueChange={(v) => setTfCorrect(v === "true")}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "fill_blank" && (
            <div className="space-y-1.5">
              <Label>Accepted answer</Label>
              <Input
                value={fillAnswer}
                onChange={(e) => setFillAnswer(e.target.value)}
                placeholder="Exact answer (case-insensitive)"
              />
            </div>
          )}

          {type === "free_text" && (
            <p className="text-sm text-muted-foreground">
              Essay questions are graded manually and do not count towards the auto score.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
