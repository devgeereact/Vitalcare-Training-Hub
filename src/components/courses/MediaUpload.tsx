import { useRef, useState } from "react"
import { Upload, Loader2, X, ImageIcon, FileText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"

const BUCKET = "course-media"

interface Props {
  value: string
  onChange: (url: string) => void
  /** "image" shows a preview thumbnail; "file" shows a filename chip. */
  variant?: "image" | "file"
  accept?: string
  /** Sub-folder inside the bucket, e.g. "courses" or "lessons". */
  folder?: string
}

/** Upload a file to Supabase Storage and return its public URL. */
export default function MediaUpload({
  value,
  onChange,
  variant = "image",
  accept = "image/*",
  folder = "courses",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handle(file: File) {
    // 10 MB ceiling keeps us inside the Supabase free Storage tier.
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large", { description: "Keep uploads under 10 MB." })
      return
    }
    setBusy(true)
    try {
      const ext = file.name.split(".").pop() ?? "bin"
      const safe = file.name
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 40)
      const path = `${folder}/${safe}-${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      })
      if (error) throw error
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      onChange(data.publicUrl)
      toast.success("Uploaded")
    } catch (err) {
      console.error("[MediaUpload]", err)
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handle(f)
          e.target.value = ""
        }}
      />

      {value && variant === "image" ? (
        <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-border">
          <img src={value} alt="Preview" className="aspect-video w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : value && variant === "file" ? (
        <div className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
          <FileText className="size-4 text-muted-foreground" />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-primary hover:underline"
          >
            {value.split("/").pop()}
          </a>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Remove file"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(variant === "image" && "h-24 w-full max-w-sm border-dashed")}
        >
          {busy ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : variant === "image" ? (
            <ImageIcon className="mr-2 size-4" />
          ) : (
            <Upload className="mr-2 size-4" />
          )}
          {busy ? "Uploading…" : variant === "image" ? "Upload image" : "Upload file"}
        </Button>
      )}
    </div>
  )
}
