import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plug, AlertCircle, CheckCircle2, Loader2, Save, ShieldAlert } from "lucide-react"

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
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <code className="truncate rounded bg-muted px-2 py-1 text-xs">{k.name}</code>
        {k.configured ? (
          <Badge variant="secondary" className="gap-1 text-success">
            <CheckCircle2 className="size-3" /> Configured
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-muted-foreground">
            Not set
          </Badge>
        )}
      </div>
      <Input
        type="password"
        autoComplete="off"
        placeholder={k.configured ? "Replace value…" : "Paste value…"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="max-w-xs"
      />
      <Button
        size="sm"
        disabled={!value.trim() || save.isPending}
        onClick={() => save.mutate()}
      >
        {save.isPending ? (
          <Loader2 className="mr-1.5 size-4 animate-spin" />
        ) : (
          <Save className="mr-1.5 size-4" />
        )}
        Save
      </Button>
    </div>
  )
}

export default function IntegrationsPage() {
  const qc = useQueryClient()
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Integrations</h1>
        <p className="mt-1 text-muted-foreground">
          Connect external services by adding their API keys and secrets.
        </p>
      </div>

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
          {data!.map((integ) => (
            <Card key={integ.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plug className="size-4 text-brand-navy" /> {integ.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {integ.keys.map((k) => (
                  <KeyRow key={k.name} k={k} onSaved={reload} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
