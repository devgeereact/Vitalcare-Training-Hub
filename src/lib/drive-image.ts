// Google Drive share links don't render in <img> reliably (the uc?export=view
// link redirects to a virus-scan/consent page). The googleusercontent CDN does.
// This converts any Drive URL we have stored into an embeddable image URL.

function extractDriveId(url: string): string | null {
  // uc?export=view&id=ID  | open?id=ID  | /d/ID/  | /file/d/ID
  const m =
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

/** Return an <img>-safe URL. Drive links become googleusercontent thumbnails. */
export function driveImageUrl(url: string | null | undefined, width = 1200): string {
  if (!url) return ""
  if (url.includes("drive.google.com") || url.includes("googleusercontent.com/d/")) {
    const id = extractDriveId(url)
    if (id) return `https://lh3.googleusercontent.com/d/${id}=w${width}`
  }
  return url
}
