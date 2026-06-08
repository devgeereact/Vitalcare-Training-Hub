import { useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
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
import { useUser } from "@/hooks/use-user"
import { FilePreviewDialog } from "@/components/files/FilePreviewDialog"
import {
  useManagedFiles,
  useFileMutations,
  resolveDownloadUrl,
  TYPE_FOLDERS,
  type ManagedFile,
  type TypeFolder,
} from "@/lib/queries/files.queries"

function fileSize(n: number): string {
  if (n <= 0) return "Unknown size"
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

const FILE_ICON: Record<TypeFolder, typeof FileText> = FOLDER_ICON

export default function FileManagerPage(): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const { data, isLoading, isError, refetch } = useManagedFiles()
  const { upload, remove } = useFileMutations()
  const { isAdmin, isManager, isTrainer } = useUser()
  const canDelete = isAdmin || isManager || isTrainer

  const [openFolder, setOpenFolder] = useState<TypeFolder | null>(null)
  const [previewFile, setPreviewFile] = useState<ManagedFile | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<TypeFolder, ManagedFile[]>()
    for (const folder of TYPE_FOLDERS) map.set(folder, [])
    for (const f of data?.files ?? []) map.get(f.folder)!.push(f)
    return map
  }, [data])

  const backend = data?.backend ?? "bucket"
  const totalFiles = data?.files.length ?? 0

  async function handleUpload(file: File): Promise<void> {
    try {
      const used = await upload.mutateAsync(file)
      toast.success(used === "drive" ? "Uploaded to Google Drive" : "Uploaded")
      // Notify other staff a new file is in the manager (server-resolved).
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: unknown }>
      void rpc("notify_file_uploaded", { p_name: file.name }).catch(() => undefined)
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  async function handleDownload(f: ManagedFile): Promise<void> {
    const url = await resolveDownloadUrl(f)
    if (!url) {
      toast.error("Could not get a download link")
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }

  async function handleRemove(f: ManagedFile): Promise<void> {
    if (!confirm(`Delete ${f.name}? This cannot be undone.`)) return
    try {
      await remove.mutateAsync(f)
      toast.success("Deleted")
      if (previewFile?.id === f.id) setPreviewOpen(false)
    } catch {
      toast.error("Could not delete the file")
    }
  }

  function openPreview(f: ManagedFile): void {
    setPreviewFile(f)
    setPreviewOpen(true)
  }

  const folderFiles = openFolder ? grouped.get(openFolder)! : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">File manager</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
            Files organised by type. Private, staff access only.
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
            if (f) void handleUpload(f)
            e.target.value = ""
          }}
        />
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
        >
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
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load files. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : totalFiles === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-navy/10 text-brand-navy">
              <FolderOpen className="size-7" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">No files yet</p>
              <p className="text-sm text-muted-foreground">
                Upload a file to get started.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
            >
              <Upload className="mr-2 size-4" />
              Upload file
            </Button>
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
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl text-foreground">{openFolder}</h2>
            <Badge variant="secondary">{folderFiles.length}</Badge>
          </div>
          <Card>
            <CardContent className="p-0">
              {folderFiles.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-14 text-center">
                  <FolderOpen className="size-7 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nothing in this folder yet.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {folderFiles.map((f) => {
                    const RowIcon = FILE_ICON[f.folder]
                    return (
                      <li
                        key={f.id}
                        className="group flex items-center gap-3 px-4 py-3 sm:px-5"
                      >
                        <button
                          type="button"
                          onClick={() => openPreview(f)}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                            <RowIcon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {f.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {fileSize(f.size)}
                              {f.modifiedAt
                                ? ` · ${format(new Date(f.modifiedAt), "d MMM yyyy")}`
                                : ""}
                            </span>
                          </span>
                          <Badge
                            variant="outline"
                            className="hidden shrink-0 gap-1 sm:inline-flex"
                          >
                            {f.backend === "drive" ? (
                              <>
                                <Cloud className="size-3" /> Drive
                              </>
                            ) : (
                              <>
                                <HardDrive className="size-3" /> Storage
                              </>
                            )}
                          </Badge>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          onClick={() => void handleDownload(f)}
                          aria-label={`Download ${f.name}`}
                        >
                          <Download className="size-4" />
                        </Button>
                        {canDelete ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => void handleRemove(f)}
                            aria-label={`Delete ${f.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </li>
                    )
                  })}
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
                disabled={count === 0}
                className="rounded-xl text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60"
              >
                <Card className="h-full transition-colors hover:border-brand-navy/40">
                  <CardContent className="flex items-center gap-3 p-5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{folder}</p>
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

      <FilePreviewDialog
        file={previewFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        canDelete={canDelete}
        onDownload={(f) => void handleDownload(f)}
        onDelete={(f) => void handleRemove(f)}
      />
    </div>
  )
}
