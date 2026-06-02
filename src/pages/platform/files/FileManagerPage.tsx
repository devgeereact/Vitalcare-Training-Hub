import { useMemo, useRef, useState } from "react"
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
  ImageIcon,
  Video,
  Music,
  File as FileIcon,
  ChevronLeft,
  Cloud,
  HardDrive,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useManagedFiles,
  useFileMutations,
  bucketDownloadUrl,
  TYPE_FOLDERS,
  type ManagedFile,
  type TypeFolder,
} from "@/lib/queries/files.queries"

function fileSize(n: number): string {
  if (n <= 0) return "—"
  return n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`
}

const FOLDER_ICON: Record<TypeFolder, typeof FileText> = {
  Pictures: ImageIcon,
  Videos: Video,
  Audio: Music,
  Documents: FileText,
  Other: FileIcon,
}

export default function FileManagerPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { data, isLoading, isError, refetch } = useManagedFiles()
  const { upload, remove } = useFileMutations()
  const [openFolder, setOpenFolder] = useState<TypeFolder | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<TypeFolder, ManagedFile[]>()
    for (const folder of TYPE_FOLDERS) map.set(folder, [])
    for (const f of data?.files ?? []) map.get(f.folder)!.push(f)
    return map
  }, [data])

  const backend = data?.backend ?? "bucket"

  async function handleUpload(file: File) {
    try {
      const used = await upload.mutateAsync(file)
      toast.success(
        used === "drive" ? "Uploaded to Google Drive" : "Uploaded",
      )
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  async function handleDownload(f: ManagedFile) {
    if (f.backend === "drive") {
      if (f.url) window.open(f.url, "_blank")
      else toast.error("No download link for this file")
      return
    }
    const url = await bucketDownloadUrl(f.ref)
    if (!url) {
      toast.error("Could not get download link")
      return
    }
    window.open(url, "_blank")
  }

  async function handleRemove(f: ManagedFile) {
    if (!confirm(`Delete ${f.name}?`)) return
    try {
      await remove.mutateAsync(f)
      toast.success("Deleted")
    } catch {
      toast.error("Could not delete")
    }
  }

  const folderFiles = openFolder ? grouped.get(openFolder)! : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">File manager</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
            Files organised by type. Private — staff access only.
            <Badge variant="secondary" className="gap-1.5">
              {backend === "drive" ? (
                <>
                  <Cloud className="size-3" /> Google Drive
                </>
              ) : (
                <>
                  <HardDrive className="size-3" /> Supabase storage
                </>
              )}
            </Badge>
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleUpload(f)
            e.target.value = ""
          }}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Upload className="mr-2 size-4" />
          )}
          Upload file
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load files.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (data?.files.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FolderOpen className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No files yet. Upload one above.
            </p>
          </CardContent>
        </Card>
      ) : openFolder ? (
        /* ----------------------------------------- inside a type folder --- */
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => setOpenFolder(null)}
          >
            <ChevronLeft className="mr-1.5 size-4" /> All folders
          </Button>
          <h2 className="font-display text-xl text-foreground">{openFolder}</h2>
          <Card>
            <CardContent className="p-0">
              {folderFiles.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Nothing in this folder yet.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {folderFiles.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                      <FileText className="size-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {fileSize(f.size)}
                          {f.modifiedAt
                            ? ` · ${format(new Date(f.modifiedAt), "d MMM yyyy")}`
                            : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleDownload(f)}
                        aria-label="Download"
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(f)}
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
      ) : (
        /* --------------------------------------------- folder overview --- */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TYPE_FOLDERS.map((folder) => {
            const Icon = FOLDER_ICON[folder]
            const count = grouped.get(folder)!.length
            return (
              <button
                key={folder}
                type="button"
                onClick={() => setOpenFolder(folder)}
                className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
              >
                <Card className="h-full transition-colors hover:border-brand-navy/40">
                  <CardContent className="flex items-center gap-3 p-5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{folder}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} file{count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
