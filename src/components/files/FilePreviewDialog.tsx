import { useEffect, useState } from "react"
import { format } from "date-fns"
import {
  AlertCircle,
  Download,
  FileText,
  ImageIcon,
  Loader2,
  Music,
  Trash2,
  Video,
  File as FileIcon,
  Cloud,
  HardDrive,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  previewKind,
  resolvePreviewSource,
  type ManagedFile,
  type PreviewKind,
  type PreviewSource,
} from "@/lib/queries/files.queries"

function fileSize(n: number): string {
  if (n <= 0) return "Unknown size"
  return n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`
}

const KIND_ICON: Record<PreviewKind, typeof FileIcon> = {
  image: ImageIcon,
  pdf: FileText,
  video: Video,
  audio: Music,
  other: FileIcon,
}

interface FilePreviewDialogProps {
  file: ManagedFile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canDelete: boolean
  onDownload: (file: ManagedFile) => void
  onDelete: (file: ManagedFile) => void
}

export function FilePreviewDialog({
  file,
  open,
  onOpenChange,
  canDelete,
  onDownload,
  onDelete,
}: FilePreviewDialogProps): React.JSX.Element {
  const [source, setSource] = useState<PreviewSource | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  )

  useEffect(() => {
    if (!open || !file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on close
      setSource(null)
      setStatus("idle")
      return
    }
    let active = true
    setStatus("loading")
    setSource(null)
    resolvePreviewSource(file)
      .then((result) => {
        if (!active) return
        if (result) {
          setSource(result)
          setStatus("ready")
        } else {
          setStatus("error")
        }
      })
      .catch((err: unknown) => {
        if (!active) return
        console.error("[FilePreviewDialog] resolve", err)
        setStatus("error")
      })
    return () => {
      active = false
    }
  }, [open, file])

  const kind = file ? previewKind(file.name, file.mime) : "other"
  const KindIcon = KIND_ICON[kind]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        {file ? (
          <>
            <DialogHeader className="space-y-1.5 border-b border-border px-6 py-4 text-left">
              <DialogTitle className="flex items-center gap-2 truncate font-sans text-base font-semibold">
                <KindIcon className="size-5 shrink-0 text-brand-navy" />
                <span className="truncate">{file.name}</span>
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span>{fileSize(file.size)}</span>
                <span aria-hidden>·</span>
                <span className="uppercase">{kind === "other" ? "File" : kind}</span>
                {file.modifiedAt ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>{format(new Date(file.modifiedAt), "d MMM yyyy")}</span>
                  </>
                ) : null}
                <Badge variant="secondary" className="gap-1">
                  {file.backend === "drive" ? (
                    <>
                      <Cloud className="size-3" /> Google Drive
                    </>
                  ) : (
                    <>
                      <HardDrive className="size-3" /> Supabase storage
                    </>
                  )}
                </Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="flex max-h-[60vh] min-h-[16rem] items-center justify-center overflow-auto bg-muted/40 p-4">
              <PreviewBody
                file={file}
                kind={kind}
                source={source}
                status={status}
                onDownload={onDownload}
              />
            </div>

            <DialogFooter className="flex-row justify-end gap-2 border-t border-border px-6 py-4">
              {canDelete ? (
                <Button
                  variant="outline"
                  className="mr-auto text-destructive hover:text-destructive"
                  onClick={() => onDelete(file)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </Button>
              ) : null}
              <Button onClick={() => onDownload(file)}>
                <Download className="mr-2 size-4" />
                Download
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

interface PreviewBodyProps {
  file: ManagedFile
  kind: PreviewKind
  source: PreviewSource | null
  status: "idle" | "loading" | "ready" | "error"
  onDownload: (file: ManagedFile) => void
}

function PreviewBody({
  file,
  kind,
  source,
  status,
  onDownload,
}: PreviewBodyProps): React.JSX.Element {
  if (status === "loading" || status === "idle") {
    return (
      <div className="flex w-full flex-col items-center gap-3 text-muted-foreground">
        <Skeleton className="h-48 w-full max-w-xl rounded-lg" />
        <span className="flex items-center gap-2 text-xs">
          <Loader2 className="size-4 animate-spin" /> Loading preview
        </span>
      </div>
    )
  }

  if (status === "error" || !source) {
    return (
      <NoPreview
        file={file}
        onDownload={onDownload}
        message="This file could not be loaded for preview."
      />
    )
  }

  // Drive embeds and PDFs render in an iframe.
  if (source.embed || (kind === "pdf" && file.backend === "drive")) {
    return (
      <iframe
        src={source.url}
        title={file.name}
        className="h-[58vh] w-full rounded-lg border border-border bg-background"
        allow="autoplay"
      />
    )
  }

  if (kind === "image") {
    return (
      <img
        src={source.url}
        alt={file.name}
        className="max-h-[58vh] max-w-full rounded-lg object-contain"
      />
    )
  }

  if (kind === "pdf") {
    return (
      <object
        data={source.url}
        type="application/pdf"
        className="h-[58vh] w-full rounded-lg border border-border bg-background"
      >
        <NoPreview
          file={file}
          onDownload={onDownload}
          message="Your browser cannot display this PDF inline."
        />
      </object>
    )
  }

  if (kind === "video") {
    return (
      <video
        src={source.url}
        controls
        className="max-h-[58vh] w-full max-w-2xl rounded-lg bg-black"
      >
        Your browser does not support inline video.
      </video>
    )
  }

  if (kind === "audio") {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4 py-8">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-navy/10 text-brand-navy">
          <Music className="size-7" />
        </span>
        <audio src={source.url} controls className="w-full">
          Your browser does not support inline audio.
        </audio>
      </div>
    )
  }

  return (
    <NoPreview
      file={file}
      onDownload={onDownload}
      message="No inline preview is available for this file type."
    />
  )
}

interface NoPreviewProps {
  file: ManagedFile
  message: string
  onDownload: (file: ManagedFile) => void
}

function NoPreview({
  file,
  message,
  onDownload,
}: NoPreviewProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <AlertCircle className="size-6" />
      </span>
      <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
      <Button size="sm" onClick={() => onDownload(file)}>
        <Download className="mr-2 size-4" />
        Download
      </Button>
    </div>
  )
}
