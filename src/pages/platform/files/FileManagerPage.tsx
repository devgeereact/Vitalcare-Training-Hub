import { useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  FolderOpen,
  AlertCircle,
  Upload,
  Download,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"

const BUCKET = "files"

interface FileRow {
  name: string
  size: number
  updatedAt: string | null
}

function kb(n: number) {
  return n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`
}

export default function FileManagerPage() {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["files", "list"],
    queryFn: async (): Promise<FileRow[]> => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list("", { limit: 200, sortBy: { column: "updated_at", order: "desc" } })
      if (error) throw error
      return (data ?? [])
        .filter((f) => f.id) // skip folder placeholders
        .map((f) => ({
          name: f.name,
          size: (f.metadata?.size as number) ?? 0,
          updatedAt: f.updated_at ?? null,
        }))
    },
  })

  async function upload(file: File) {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File too large", { description: "25 MB max." })
      return
    }
    setBusy(true)
    const { error } = await supabase.storage.from(BUCKET).upload(file.name, file, {
      upsert: true,
    })
    setBusy(false)
    if (error) {
      toast.error("Upload failed", { description: error.message })
      return
    }
    toast.success("Uploaded")
    qc.invalidateQueries({ queryKey: ["files", "list"] })
  }

  async function download(name: string) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(name, 120)
    if (error || !data?.signedUrl) {
      toast.error("Could not get download link")
      return
    }
    window.open(data.signedUrl, "_blank")
  }

  async function remove(name: string) {
    if (!confirm(`Delete ${name}?`)) return
    const { error } = await supabase.storage.from(BUCKET).remove([name])
    if (error) {
      toast.error("Could not delete")
      return
    }
    toast.success("Deleted")
    qc.invalidateQueries({ queryKey: ["files", "list"] })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">File manager</h1>
          <p className="mt-1 text-muted-foreground">
            Shared files for your team. Private — staff access only.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload(f)
            e.target.value = ""
          }}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
          Upload file
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load files.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <FolderOpen className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">No files yet. Upload one above.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data!.map((f) => (
                <li key={f.name} className="flex items-center gap-3 px-5 py-3">
                  <FileText className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {kb(f.size)}
                      {f.updatedAt ? ` · ${format(new Date(f.updatedAt), "d MMM yyyy")}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => download(f.name)} aria-label="Download">
                    <Download className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(f.name)}
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
