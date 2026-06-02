import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

/**
 * File manager backed by two sources:
 *   - Google Drive (the connected folder) when the drive-list Edge Function
 *     reports it is configured. Files there are Drive-backed.
 *   - Supabase Storage "files" bucket as the fallback. Bucket-backed.
 *
 * Whichever source is active, files are grouped by TYPE into virtual folders:
 * Pictures, Videos, Audio, Documents, Other.
 */

export const TYPE_FOLDERS = [
  "Pictures",
  "Videos",
  "Audio",
  "Documents",
  "Other",
] as const

export type TypeFolder = (typeof TYPE_FOLDERS)[number]

export type FileBackend = "drive" | "bucket"

export interface ManagedFile {
  id: string
  name: string
  size: number
  modifiedAt: string | null
  folder: TypeFolder
  backend: FileBackend
  /** Drive: file id. Bucket: object path. */
  ref: string
  /** Drive view link when available. */
  url?: string
}

export const BUCKET = "files"

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic", "avif"]
const VIDEO_EXT = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "wmv", "flv"]
const AUDIO_EXT = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"]
const DOC_EXT = [
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv", "txt", "rtf",
  "odt", "ods", "odp", "md", "pages", "key", "numbers",
]

function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ""
}

/** Decide the type folder from a filename and (optional) mime type. */
export function categorise(name: string, mime?: string): TypeFolder {
  const m = (mime ?? "").toLowerCase()
  if (m.startsWith("image/")) return "Pictures"
  if (m.startsWith("video/")) return "Videos"
  if (m.startsWith("audio/")) return "Audio"
  if (
    m.startsWith("application/pdf") ||
    m.includes("word") ||
    m.includes("document") ||
    m.includes("spreadsheet") ||
    m.includes("presentation") ||
    m.startsWith("text/")
  )
    return "Documents"

  const ext = extOf(name)
  if (IMAGE_EXT.includes(ext)) return "Pictures"
  if (VIDEO_EXT.includes(ext)) return "Videos"
  if (AUDIO_EXT.includes(ext)) return "Audio"
  if (DOC_EXT.includes(ext)) return "Documents"
  return "Other"
}

interface DriveListFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  webViewLink?: string
  webContentLink?: string
}

export interface FilesResult {
  backend: FileBackend
  files: ManagedFile[]
}

export const filesKeys = {
  list: () => ["files", "managed", "list"] as const,
}

async function listBucket(): Promise<ManagedFile[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 500, sortBy: { column: "updated_at", order: "desc" } })
  if (error) {
    console.error("[listBucket]", error)
    throw error
  }
  return (data ?? [])
    .filter((f) => f.id)
    .map((f) => ({
      id: f.name,
      name: f.name,
      size: (f.metadata?.size as number) ?? 0,
      modifiedAt: f.updated_at ?? null,
      folder: categorise(f.name, f.metadata?.mimetype as string | undefined),
      backend: "bucket" as const,
      ref: f.name,
    }))
}

/**
 * Try Google Drive first. If the Drive function reports it is not configured
 * (or errors), fall back to the Supabase Storage bucket.
 */
export function useManagedFiles() {
  return useQuery({
    queryKey: filesKeys.list(),
    queryFn: async (): Promise<FilesResult> => {
      try {
        const { data, error } = await supabase.functions.invoke<{
          ok?: boolean
          files?: DriveListFile[]
          notConfigured?: boolean
        }>("drive-list", { body: {} })
        if (!error && data?.ok && Array.isArray(data.files)) {
          const files: ManagedFile[] = data.files.map((f) => ({
            id: f.id,
            name: f.name,
            size: f.size ? Number(f.size) : 0,
            modifiedAt: f.modifiedTime ?? null,
            folder: categorise(f.name, f.mimeType),
            backend: "drive" as const,
            ref: f.id,
            url: f.webViewLink ?? f.webContentLink,
          }))
          return { backend: "drive", files }
        }
      } catch (err) {
        // Drive not reachable — fall through to bucket.
        console.error("[useManagedFiles] drive", err)
      }
      return { backend: "bucket", files: await listBucket() }
    },
  })
}

export function useFileMutations() {
  const qc = useQueryClient()
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: filesKeys.list() })

  /**
   * Upload to Drive when connected (auto-categorises server-side by virtue of
   * the connected folder), otherwise to the Supabase bucket. Returns the
   * backend that handled the upload.
   */
  const upload = useMutation({
    mutationFn: async (file: File): Promise<FileBackend> => {
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File too large. Keep uploads under 50 MB.")
      }
      // Try Drive.
      try {
        const fd = new FormData()
        fd.append("file", file)
        const { data, error } = await supabase.functions.invoke<{
          ok?: boolean
          url?: string
        }>("drive-upload", { body: fd })
        if (!error && data?.ok) return "drive"
      } catch (err) {
        console.error("[useFileMutations.upload] drive", err)
      }
      // Bucket fallback.
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(file.name, file, { upsert: true })
      if (error) {
        console.error("[useFileMutations.upload] bucket", error)
        throw error
      }
      return "bucket"
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (f: ManagedFile) => {
      if (f.backend === "bucket") {
        const { error } = await supabase.storage.from(BUCKET).remove([f.ref])
        if (error) {
          console.error("[useFileMutations.remove] bucket", error)
          throw error
        }
        return
      }
      // Drive delete via Edge Function (re-uses drive-upload host project).
      const { data, error } = await supabase.functions.invoke<{ ok?: boolean }>(
        "drive-delete",
        { body: { id: f.ref } },
      )
      if (error || !data?.ok) {
        console.error("[useFileMutations.remove] drive", error)
        throw error ?? new Error("Drive delete failed")
      }
    },
    onSuccess: invalidate,
  })

  return { upload, remove }
}

/** Resolve a temporary download URL for a bucket file. */
export async function bucketDownloadUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 120)
  if (error || !data?.signedUrl) {
    console.error("[bucketDownloadUrl]", error)
    return null
  }
  return data.signedUrl
}
