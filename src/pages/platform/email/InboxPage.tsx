import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"
import { Inbox, AlertCircle, RefreshCw, Loader2, Mail, PenSquare } from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import type { MailMessage } from "@/types/database.types"

export default function InboxPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<MailMessage | null>(null)
  const [syncing, setSyncing] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mail", "inbox"],
    queryFn: async (): Promise<MailMessage[]> => {
      const { data, error } = await supabase
        .from("mail_messages")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as MailMessage[]
    },
  })

  async function syncNow() {
    setSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke("imap-sync", { body: {} })
      if (error) throw error
      toast.success(`Synced — ${data?.stored ?? 0} message(s)`)
      qc.invalidateQueries({ queryKey: ["mail", "inbox"] })
    } catch (err) {
      toast.error("Sync failed", {
        description: err instanceof Error ? err.message : "Check IMAP settings.",
      })
    } finally {
      setSyncing(false)
    }
  }

  function open(m: MailMessage) {
    setSelected(m)
    if (!m.seen) {
      supabase.from("mail_messages").update({ seen: true }).eq("id", m.id).then(() => {
        qc.invalidateQueries({ queryKey: ["mail", "inbox"] })
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Inbox</h1>
          <p className="mt-1 text-muted-foreground">
            Mail pulled from info@vitalcare.uk. Syncs automatically every 10 minutes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncNow} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Sync now
          </Button>
          <Button asChild>
            <Link to="/platform/email">
              <PenSquare className="mr-2 size-4" /> Compose
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load the inbox.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Inbox className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Inbox empty. Click “Sync now” to pull your latest mail.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data!.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => open(m)}
                    className={cn(
                      "flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                      !m.seen && "bg-muted/40",
                    )}
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                      <Mail className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-sm", !m.seen && "font-semibold")}>
                          {m.from_name || m.from_addr || "Unknown sender"}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {m.received_at
                            ? formatDistanceToNow(new Date(m.received_at), { addSuffix: true })
                            : ""}
                        </span>
                      </span>
                      <span className="block truncate text-sm">{m.subject}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {m.snippet}
                      </span>
                    </span>
                    {!m.seen && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-gold" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.subject || "(no subject)"}</DialogTitle>
                <DialogDescription>
                  {selected.from_name ? `${selected.from_name} · ` : ""}
                  {selected.from_addr}
                  {selected.received_at
                    ? ` · ${format(new Date(selected.received_at), "d MMM yyyy, HH:mm")}`
                    : ""}
                </DialogDescription>
              </DialogHeader>
              <pre className="whitespace-pre-wrap break-words font-sans text-sm text-foreground">
                {(selected.body_html || selected.snippet || "")
                  .replace(/<[^>]+>/g, " ")
                  .replace(/&nbsp;/g, " ")
                  .slice(0, 8000)}
              </pre>
              {selected.from_addr && (
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <a href={`mailto:${selected.from_addr}`}>Reply by email</a>
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
