import { useState } from "react"
import { Sparkles, Loader2, Copy, Check, CornerDownLeft, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/hooks/use-user"
import { sendChat } from "@/lib/queries/ai.queries"

interface Props {
  /** What the assistant is helping with, e.g. "a course description". */
  task: string
  /** Extra context fed to the model (title, topic, existing text). */
  context?: string
  /** Default instruction shown in the box. */
  defaultInstruction?: string
  /** If provided, an "Insert" button applies the generated text. */
  onInsert?: (text: string) => void
  label?: string
}

/** Admin-only AI helper. Generates draft text for any creation surface. */
export default function AiAssistButton({
  task,
  context,
  defaultInstruction,
  onInsert,
  label = "AI assist",
}: Props) {
  const { isAdmin } = useUser()
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState(defaultInstruction ?? "")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isAdmin) return null

  async function generate() {
    setLoading(true)
    setResult("")
    try {
      const prompt = [
        `Help me write ${task}.`,
        instruction.trim() ? `Instruction: ${instruction.trim()}` : "",
        context?.trim() ? `Context:\n${context.trim()}` : "",
        "Return only the content, no preamble.",
      ]
        .filter(Boolean)
        .join("\n\n")
      const reply = await sendChat([{ role: "user", content: prompt }])
      setResult(reply)
    } catch (err) {
      toast.error("AI unavailable", {
        description: err instanceof Error ? err.message : "Try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="size-3.5 text-brand-gold" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 space-y-3">
        <div>
          <p className="text-sm font-medium">AI assist</p>
          <p className="text-xs text-muted-foreground">Generate a draft for {task}.</p>
        </div>
        <Textarea
          rows={2}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={`What should it cover?`}
        />
        <Button size="sm" onClick={generate} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : result ? (
            <RefreshCw className="mr-1.5 size-4" />
          ) : (
            <Sparkles className="mr-1.5 size-4" />
          )}
          {loading ? "Generating…" : result ? "Regenerate" : "Generate"}
        </Button>

        {result && (
          <div className="space-y-2">
            <Textarea
              rows={6}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              {onInsert && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onInsert(result)
                    setOpen(false)
                    toast.success("Inserted")
                  }}
                >
                  <CornerDownLeft className="mr-1.5 size-4" /> Insert
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(result)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
              >
                {copied ? <Check className="mr-1.5 size-4" /> : <Copy className="mr-1.5 size-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
