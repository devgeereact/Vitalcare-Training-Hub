import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Plug,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
  ShieldAlert,
  HardDrive,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"
import SettingsShell from "@/components/settings/SettingsShell"

interface KeyStatus {
  name: string
  configured: boolean
}
interface Integration {
  id: string
  label: string
  keys: KeyStatus[]
}

function KeyRow({ k, onSaved }: { k: KeyStatus; onSaved: () => void }) {
  const [value, setValue] = useState("")
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
      <div className="flex gap-2">
        <Input
          type="password"
          autoComplete="off"
          placeholder={k.configured ? "Enter a new value to replace…" : "Paste value…"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" disabled={!value.trim() || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 size-4" />
          )}
          Save
        </Button>
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

export default function IntegrationsPage() {
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()

  useEffect(() => {
    const d = params.get("drive")
    if (!d) return
    if (d === "connected") toast.success("Google Drive connected")
    else if (d === "norefresh") toast.error("Reconnect needed — no refresh token returned")
    else if (d === "noclient") toast.error("Set Drive client ID and secret first")
    else if (d === "error") toast.error("Google Drive connection failed")
    params.delete("drive")
    setParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  return (
    <SettingsShell description="Connect external services by adding their API keys and secrets.">
      <Card className="border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-muted-foreground">
            Keys are stored server-side and never shown again after saving. Only a
            super admin can view or change this page.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
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
        <div className="space-y-4">
          {data!.map((integ) => {
            const set = integ.keys.filter((k) => k.configured).length
            const allSet = set === integ.keys.length
            return (
            <Card key={integ.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
                  <span className="flex items-center gap-2">
                    <Plug className="size-4 text-brand-navy" /> {integ.label}
                  </span>
                  <Badge
                    variant="secondary"
                    className={allSet ? "text-success" : "text-muted-foreground"}
                  >
                    {set}/{integ.keys.length} set
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {integ.keys.map((k) => (
                  <KeyRow key={k.name} k={k} onSaved={reload} />
                ))}
                {integ.id === "google_drive" && (
                  <div className="border-t border-border pt-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      After saving the client ID and secret, authorise Drive access
                      to generate the refresh token.
                    </p>
                    <ConnectDriveButton />
                  </div>
                )}
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </SettingsShell>
  )
}
