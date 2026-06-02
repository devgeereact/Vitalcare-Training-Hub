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
  /** Drive direct download/content link when available. */
  downloadUrl?: string
  /** MIME type when the source reports it. */
  mime?: string
}

export const BUCKET = "files"

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic", "avif"]
const VIDEO_EXT = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "wmv", "flv"]
const AUDIO_EXT = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"]
const DOC_EXT = [
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv", "txt", "rtf",
  "odt", "ods", "odp", "md", "pages", "key", "numbers",
]

export function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ""
}

/** Media kind decides how a file is previewed in the dialog. */
export type PreviewKind = "image" | "pdf" | "video" | "audio" | "other"

const PREVIEW_IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg"]
const PREVIEW_VIDEO_EXT = ["mp4", "webm", "mov"]
const PREVIEW_AUDIO_EXT = ["mp3", "wav", "m4a", "ogg"]

/** Decide how a file should be previewed, from filename and (optional) mime. */
export function previewKind(name: string, mime?: string): PreviewKind {
  const m = (mime ?? "").toLowerCase()
  if (m.startsWith("image/")) return "image"
  if (m === "application/pdf") return "pdf"
  if (m.startsWith("video/")) return "video"
  if (m.startsWith("audio/")) return "audio"

  const ext = extOf(name)
  if (PREVIEW_IMAGE_EXT.includes(ext)) return "image"
  if (ext === "pdf") return "pdf"
  if (PREVIEW_VIDEO_EXT.includes(ext)) return "video"
  if (PREVIEW_AUDIO_EXT.includes(ext)) return "audio"
  return "other"
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
      mime: (f.metadata?.mimetype as string | undefined) ?? undefined,
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
            downloadUrl: f.webContentLink ?? f.webViewLink,
            mime: f.mimeType,
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

export interface PreviewSource {
  /** Working URL for the chosen preview element. */
  url: string
  /** How the file should be rendered. */
  kind: PreviewKind
  /**
   * Drive viewer/preview embeds expect an iframe rather than a raw media tag,
   * so the dialog renders an iframe regardless of media kind when this is set.
   */
  embed: boolean
}

const DRIVE_ID = /[-\w]{25,}/

function driveFileId(f: ManagedFile): string | null {
  if (f.ref && DRIVE_ID.test(f.ref)) return f.ref
  const fromUrl = (f.url ?? "").match(DRIVE_ID)
  return fromUrl ? fromUrl[0] : null
}

/**
 * Resolve a working preview URL for a file.
 *   - Bucket objects: a short-lived signed URL (raw media, embeds inline).
 *   - Drive objects: Google's inline preview iframe URL when an id is known,
 *     otherwise the view link the list query exposes.
 */
export async function resolvePreviewSource(
  f: ManagedFile,
): Promise<PreviewSource | null> {
  const kind = previewKind(f.name, f.mime)

  if (f.backend === "bucket") {
    const url = await bucketDownloadUrl(f.ref)
    if (!url) return null
    return { url, kind, embed: false }
  }

  // Drive: use Google's embeddable preview iframe so private files render
  // without a separate signed-URL round trip.
  const id = driveFileId(f)
  if (id) {
    return {
      url: `https://drive.google.com/file/d/${id}/preview`,
      kind,
      embed: kind !== "other",
    }
  }
  if (f.url) return { url: f.url, kind, embed: true }
  return null
}

/** Resolve a working download URL for any file. */
export async function resolveDownloadUrl(
  f: ManagedFile,
): Promise<string | null> {
  if (f.backend === "drive") return f.downloadUrl ?? f.url ?? null
  return bucketDownloadUrl(f.ref)
}
