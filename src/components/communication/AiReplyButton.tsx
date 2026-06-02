import { useState } from "react"
import { Sparkles, Loader2, Check, RefreshCw } from "lucide-react"
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
  /** Recent messages in the thread, oldest first, for context. */
  history: { mine: boolean; body: string }[]
  /** Name of the person being replied to. */
  otherName: string
  /** Called with the drafted reply text when the user accepts it. */
  onDraft: (text: string) => void
}

/* Vitalcare brand voice for any learner-facing reply: authoritative,
 * approachable, evidence-led, human. UK English. No em-dashes. No banned words. */
const SYSTEM_TONE = [
  "You draft short replies for Vitalcare Training Hub, a UK healthcare training provider.",
  "Voice: authoritative, approachable, evidence-led, human. Write in UK English.",
  "Rules: never use em-dashes; use commas, colons or brackets instead.",
  "Avoid these words: delve, tapestry, seamless, leverage, holistic, comprehensive, bespoke, streamline, facilitate, empower, world-class.",
  "Be concise and practical. Address the learner by name where natural. No preamble, no sign-off block, just the reply body.",
].join(" ")

/** Staff-only. Drafts a clear reply to a learner in the Vitalcare tone using
 *  the same ai-chat edge function the rest of the platform uses. */
export default function AiReplyButton({ history, otherName, onDraft }: Props) {
  const { isAdmin, isTrainer, isManager } = useUser()
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState("")
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isAdmin && !isTrainer && !isManager) return null

  async function generate() {
    setLoading(true)
    setDraft("")
    try {
      const transcript = history
        .slice(-8)
        .map((m) => `${m.mine ? "Us" : otherName}: ${m.body}`)
        .join("\n")
      const prompt = [
        SYSTEM_TONE,
        `You are replying to ${otherName}.`,
        transcript ? `Recent conversation:\n${transcript}` : "",
        instruction.trim() ? `What we want to say: ${instruction.trim()}` : "",
        "Write the reply now.",
      ]
        .filter(Boolean)
        .join("\n\n")
      const reply = await sendChat([{ role: "user", content: prompt }])
      setDraft(reply.trim())
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
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Draft an AI reply"
          className="shrink-0 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          <Sparkles className="size-4 text-brand-gold" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 space-y-3">
        <div>
          <p className="text-sm font-medium">AI reply</p>
          <p className="text-xs text-muted-foreground">
            Drafts a clear reply in the Vitalcare tone. Review before sending.
          </p>
        </div>
        <Textarea
          rows={2}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Optional: what should the reply cover?"
        />
        <Button size="sm" onClick={generate} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : draft ? (
            <RefreshCw className="mr-1.5 size-4" />
          ) : (
            <Sparkles className="mr-1.5 size-4" />
          )}
          {loading ? "Drafting…" : draft ? "Regenerate" : "Draft reply"}
        </Button>

        {draft && (
          <div className="space-y-2">
            <Textarea
              rows={6}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="text-sm"
            />
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                onDraft(draft)
                setOpen(false)
                setDraft("")
                setInstruction("")
              }}
            >
              <Check className="mr-1.5 size-4" /> Use this reply
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
