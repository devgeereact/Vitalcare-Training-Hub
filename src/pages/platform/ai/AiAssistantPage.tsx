import { useRef, useState } from "react"
import { toast } from "sonner"
import { Sparkles, Send, Loader2, RotateCcw } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  sendChat,
  persistConversation,
  type ChatMessage,
} from "@/lib/queries/ai.queries"

const SUGGESTIONS = [
  "Summarise the CSTF mandatory training topics.",
  "Write 3 quiz questions on infection prevention.",
  "Explain safe moving and handling in simple terms.",
]

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const convId = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function send(text: string) {
    const content = text.trim()
    if (!content || sending) return
    const next: ChatMessage[] = [...messages, { role: "user", content }]
    setMessages(next)
    setInput("")
    setSending(true)
    try {
      const reply = await sendChat(next)
      const withReply: ChatMessage[] = [...next, { role: "assistant", content: reply }]
      setMessages(withReply)
      convId.current = await persistConversation(convId.current, withReply)
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 9e9 }))
    } catch (err) {
      toast.error("AI unavailable", {
        description: err instanceof Error ? err.message : "Try again later.",
      })
      setMessages(messages) // roll back the optimistic user message
    } finally {
      setSending(false)
    }
  }

  function reset() {
    setMessages([])
    convId.current = null
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="flex items-center justify-between gap-3 pb-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">AI Assistant</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Course Q&amp;A, quiz ideas and learning support.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="mr-1.5 size-4" /> New chat
          </Button>
        )}
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-7" />
              </div>
              <p className="text-sm text-muted-foreground">
                Ask anything about your courses and training.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t border-border p-3">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <Textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder="Message the assistant…"
              className="max-h-40 min-h-[44px] resize-none"
            />
            <Button type="submit" size="icon" className="size-11 shrink-0" disabled={sending || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
