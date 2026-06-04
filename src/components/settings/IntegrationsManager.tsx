import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Plug,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Save,
  ShieldAlert,
  Info,
  HardDrive,
  Trash2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"

/** Keys whose values are long JSON blobs, better edited in a textarea. */
const MULTILINE_KEYS = new Set(["GOOGLE_SA_JSON", "VAPID_JWK"])

interface KeyStatus {
  name: string
  configured: boolean
}
interface Integration {
  id: string
  label: string
  keys: KeyStatus[]
}

type IntegStatus = "connected" | "partial" | "none"

function statusOf(integ: Integration): IntegStatus {
  const set = integ.keys.filter((k) => k.configured).length
  if (set === 0) return "none"
  if (set === integ.keys.length) return "connected"
  return "partial"
}

function KeyRow({ k, onSaved }: { k: KeyStatus; onSaved: () => void }) {
  const [value, setValue] = useState("")
  const multiline = MULTILINE_KEYS.has(k.name)

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("integrations", {
        body: { action: "set", name: k.name, value },
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(`${k.name} saved`)
      setValue("")
      onSaved()
    },
    onError: () => toast.error("Could not save", { description: "Super-admin only." }),
  })

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("integrations", {
        body: { action: "remove", name: k.name },
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(`${k.name} cleared`)
      onSaved()
    },
    onError: () => toast.error("Could not clear", { description: "Super-admin only." }),
  })

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <code className="truncate rounded bg-muted px-2 py-1 text-xs">{k.name}</code>
        {k.configured ? (
          <Badge variant="secondary" className="shrink-0 gap-1 text-success">
            <CheckCircle2 className="size-3" /> Configured
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0 text-muted-foreground">
            Not set
          </Badge>
        )}
      </div>
      <div className={multiline ? "space-y-2" : "flex gap-2"}>
        {multiline ? (
          <Textarea
            autoComplete="off"
            spellCheck={false}
            placeholder={k.configured ? "Paste a new JSON value to replace…" : "Paste JSON value…"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-24 font-mono text-xs"
          />
        ) : (
          <Input
            type="password"
            autoComplete="off"
            placeholder={k.configured ? "Enter a new value to replace…" : "Paste value…"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1"
          />
        )}
        <div className="flex gap-2">
          <Button size="sm" disabled={!value.trim() || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 size-4" />
            )}
            Save
          </Button>
          {k.configured ? (
            <Button
              size="sm"
              variant="outline"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
              aria-label={`Clear ${k.name}`}
            >
              {remove.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ConnectDriveButton() {
  const [busy, setBusy] = useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          const { data, error } = await supabase.functions.invoke("integrations", {
            body: { action: "drive_auth_url" },
          })
          if (error || !data?.url) throw error ?? new Error("No URL")
          window.location.href = data.url as string
        } catch {
          toast.error("Set GDRIVE_CLIENT_ID and GDRIVE_CLIENT_SECRET first")
          setBusy(false)
        }
      }}
    >
      {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <HardDrive className="mr-2 size-4" />}
      Connect Google Drive
    </Button>
  )
}

/**
 * Super-admin API key manager. Each integration is a card showing whether it is
 * connected; clicking opens a dialog to set or replace its keys. Keys are
 * write-only: stored server-side, never shown again.
 */
export default function IntegrationsManager(): React.ReactElement {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Integration | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["integrations", "list"],
    queryFn: async (): Promise<Integration[]> => {
      const { data, error } = await supabase.functions.invoke("integrations", {
        body: { action: "list" },
      })
      if (error) throw error
      return (data?.integrations ?? []) as Integration[]
    },
  })
  const reload = () => qc.invalidateQueries({ queryKey: ["integrations", "list"] })

  // Keep the open dialog's data fresh after a save.
  const current = selected
    ? (data ?? []).find((i) => i.id === selected.id) ?? selected
    : null

  return (
    <div className="space-y-6">
      <Card className="border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-muted-foreground">
            Keys are stored server-side and never shown again after saving. Saved
            keys take effect automatically for services that resolve them through
            the platform. Only a super admin can view or change this page.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-muted/30">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-brand-navy" />
          <p className="text-muted-foreground">
            Supabase keys (project URL and service role) are injected
            automatically. Rotate the service role key in the Supabase dashboard
            under Project Settings, API. It is not set here.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load integrations. Super-admin access is required.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((integ) => {
            const status = statusOf(integ)
            const set = integ.keys.filter((k) => k.configured).length
            return (
              <button
                key={integ.id}
                type="button"
                onClick={() => setSelected(integ)}
                className="group flex flex-col rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy">
                    <Plug className="size-4" />
                  </span>
                  {status === "connected" ? (
                    <Badge variant="secondary" className="gap-1 text-success">
                      <CheckCircle2 className="size-3" /> Connected
                    </Badge>
                  ) : status === "partial" ? (
                    <Badge variant="secondary" className="gap-1 text-warning">
                      <CircleDashed className="size-3" /> Partial
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">
                      Not set
                    </Badge>
                  )}
                </div>
                <h3 className="mt-4 font-semibold text-brand-navy">{integ.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {set}/{integ.keys.length} keys set · click to manage
                </p>
              </button>
            )
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {current ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plug className="size-4 text-brand-navy" /> {current.label}
                </DialogTitle>
                <DialogDescription>
                  Enter a value to set or replace a key. Values are write-only and
                  never shown again.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {current.keys.map((k) => (
                  <KeyRow key={k.name} k={k} onSaved={reload} />
                ))}
                {current.id === "google_drive" ? (
                  <div className="border-t border-border pt-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      After saving the client ID and secret, authorise Drive access
                      to generate the refresh token.
                    </p>
                    <ConnectDriveButton />
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
