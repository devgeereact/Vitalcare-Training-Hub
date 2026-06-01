import { useEffect, useRef, useState } from "react"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"
import { MessageSquare, AlertCircle, Send, ArrowLeft } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import {
  useThreads,
  useThread,
  useSendMessage,
} from "@/lib/queries/communication.queries"

function ThreadView({
  userId,
  otherId,
  otherName,
  onBack,
}: {
  userId: string
  otherId: string
  otherName: string
  onBack: () => void
}) {
  const { data, isLoading, isError, refetch } = useThread(userId, otherId)
  const send = useSendMessage(userId)
  const [draft, setDraft] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [data?.length])

  function submit() {
    const body = draft.trim()
    if (!body) return
    setDraft("")
    send
      .mutateAsync({ recipientId: otherId, body })
      .catch(() => toast.error("Could not send. Please try again."))
  }

  return (
    <div className="flex h-[calc(100svh-12rem)] flex-col">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="flex size-9 items-center justify-center rounded-full bg-brand-navy/10 text-sm font-semibold text-brand-navy">
          {otherName.slice(0, 1).toUpperCase()}
        </span>
        <p className="font-medium">{otherName}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-2/3" />
          ))
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="size-7 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load messages.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          (data ?? []).map((m) => {
            const mine = m.sender_id === userId
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                    mine
                      ? "rounded-br-sm bg-brand-navy text-white"
                      : "rounded-bl-sm bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "text-white/60" : "text-muted-foreground",
                    )}
                  >
                    {format(new Date(m.created_at), "HH:mm")}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <Input
          placeholder="Write a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <Button size="icon" onClick={submit} disabled={!draft.trim() || send.isPending}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useThreads(user?.id)
  const [active, setActive] = useState<{ id: string; name: string } | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Messages</h1>
        <p className="mt-1 text-muted-foreground">
          Direct conversations with learners, trainers and staff.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-[320px_1fr]">
          {/* Thread list */}
          <div
            className={cn(
              "border-r border-border",
              active ? "hidden lg:block" : "block",
            )}
          >
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <AlertCircle className="size-7 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  Could not load conversations.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : (data?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <MessageSquare className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No conversations yet. Messages you send or receive will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {data!.map((t) => (
                  <li key={t.otherId}>
                    <button
                      type="button"
                      onClick={() => setActive({ id: t.otherId, name: t.otherName })}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                        active?.id === t.otherId && "bg-muted",
                      )}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-navy/10 text-sm font-semibold text-brand-navy">
                        {t.otherName.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {t.otherName}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(t.lastAt), { addSuffix: true })}
                          </span>
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {t.lastBody}
                        </span>
                      </span>
                      {t.unread > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-brand-gold text-[10px] font-bold text-brand-navy">
                          {t.unread}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Conversation */}
          <div className={cn(active ? "block" : "hidden lg:block")}>
            {active && user?.id ? (
              <ThreadView
                userId={user.id}
                otherId={active.id}
                otherName={active.name}
                onBack={() => setActive(null)}
              />
            ) : (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 text-center">
                <MessageSquare className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select a conversation to start reading.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
