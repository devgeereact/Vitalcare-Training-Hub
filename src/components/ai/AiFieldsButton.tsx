import { useState } from "react"
import { Sparkles, Loader2, RefreshCw, Check } from "lucide-react"
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

export interface AiField {
  key: string
  label: string
  /** "html" wraps paragraphs in <p> for rich-text fields. */
  format?: "text" | "html"
}

interface Props {
  /** What is being generated, e.g. "a healthcare training course". */
  subject: string
  fields: AiField[]
  onApply: (values: Record<string, string>) => void
  context?: string
  label?: string
}

/** Admin-only. Generates several named fields at once (title, summary, …). */
export default function AiFieldsButton({
  subject,
  fields,
  onApply,
  context,
  label = "AI: generate all",
}: Props) {
  const { isAdmin } = useUser()
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState("")
  const [result, setResult] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isAdmin) return null

  function toHtml(text: string) {
    return text
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("")
  }

  async function generate() {
    setLoading(true)
    setResult(null)
    try {
      const labels = fields.map((f) => f.label.toUpperCase())
      const prompt = [
        `Generate ${subject}. Return each field on its own block, prefixed exactly with the field name and a colon, in this order: ${labels.join(", ")}.`,
        instruction.trim() ? `Instruction: ${instruction.trim()}` : "",
        context?.trim() ? `Context:\n${context.trim()}` : "",
        `Example format:\n${labels.map((l) => `${l}: ...`).join("\n")}`,
        "No preamble, no markdown headings.",
      ]
        .filter(Boolean)
        .join("\n\n")
      const reply = await sendChat([{ role: "user", content: prompt }])

      // Parse "LABEL: value" blocks.
      const out: Record<string, string> = {}
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i]
        const lab = f.label.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const next = fields
          .slice(i + 1)
          .map((n) => n.label.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        const stop = next.length ? `(?=\\n\\s*(?:${next.join("|")})\\s*:)` : "$"
        const re = new RegExp(`${lab}\\s*:\\s*([\\s\\S]*?)${stop}`, "i")
        const m = reply.match(re)
        const val = (m ? m[1] : "").trim()
        out[f.key] = f.format === "html" ? toHtml(val) : val
      }
      setResult(out)
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
          <p className="text-sm font-medium">Generate all fields</p>
          <p className="text-xs text-muted-foreground">
            Fills {fields.map((f) => f.label.toLowerCase()).join(", ")}.
          </p>
        </div>
        <Textarea
          rows={2}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Topic or any specifics (optional)"
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
            {fields.map((f) => (
              <div key={f.key}>
                <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
                <p className="line-clamp-3 rounded bg-muted/50 p-2 text-xs">
                  {(result[f.key] || "-").replace(/<[^>]+>/g, " ")}
                </p>
              </div>
            ))}
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                onApply(result)
                setOpen(false)
                toast.success("Applied to all fields")
              }}
            >
              <Check className="mr-1.5 size-4" /> Apply to all fields
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
