import { useRef, useState } from "react"
import { Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const BUCKET = "course-media"

interface Props {
  /** Sub-folder inside the bucket, e.g. "avatars" or "banners". */
  folder: string
  /** Called with the new public URL once the upload completes. */
  onUploaded: (url: string) => void
  /** Visual label for screen readers and the floating control. */
  label: string
  /** Extra classes for the trigger button. */
  className?: string
  busyLabelClassName?: string
}

/**
 * Small camera-button uploader for avatar and cover images. Uploads to the
 * public `course-media` bucket and returns the public URL. Reused across the
 * profile header.
 */
export default function ProfileImageUpload({
  folder,
  onUploaded,
  label,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handle(file: File): Promise<void> {
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file")
      return
    }
    // 5 MB keeps us inside the Supabase free Storage tier.
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large", { description: "Keep it under 5 MB." })
      return
    }
    setBusy(true)
    try {
      const ext = file.name.split(".").pop() ?? "jpg"
      const path = `${folder}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      })
      if (error) throw error
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      onUploaded(data.publicUrl)
      toast.success("Image uploaded")
    } catch (err) {
      console.error("[ProfileImageUpload]", err)
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handle(f)
          e.target.value = ""
        }}
      />
      <button
        type="button"
        aria-label={label}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex items-center justify-center rounded-full bg-brand-navy text-white shadow-sm transition hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2 disabled:opacity-60",
          className,
        )}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Camera className="size-4" />
        )}
      </button>
    </>
  )
}
