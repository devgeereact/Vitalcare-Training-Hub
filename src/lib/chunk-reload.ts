import { lazy, type ComponentType } from "react"

// After a deploy, hashed chunk filenames change. A tab opened before the deploy
// will try to load an old chunk that no longer exists ("Failed to fetch
// dynamically imported module"), which crashes a lazy-loaded page. These helpers
// recover by reloading once to pull the fresh assets.

export const CHUNK_RELOAD_KEY = "vc-chunk-reloaded"

/** True for a dynamic-import / chunk-load failure message. */
export function isChunkLoadError(message: string | undefined | null): boolean {
  if (!message) return false
  return /failed to fetch dynamically imported module|error loading dynamically imported module|loading chunk|importing a module|dynamically imported module/i.test(
    message,
  )
}

/**
 * Reload the page once to recover from a stale chunk. Guarded so it never loops:
 * a fresh load clears the flag (see main.tsx) once the app has run for a while.
 * Returns true if a reload was triggered.
 */
export function reloadOnceForChunk(): boolean {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") return false
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1")
    window.location.reload()
    return true
  } catch {
    return false
  }
}

/**
 * Like React.lazy, but if the dynamic import fails because of a stale chunk it
 * reloads once instead of surfacing a blank crash.
 */
export function lazyWithReload<P>(factory: () => Promise<{ default: ComponentType<P> }>) {
  return lazy(async () => {
    try {
      return await factory()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (isChunkLoadError(msg) && reloadOnceForChunk()) {
        // Stall until the reload takes over so nothing renders the failure.
        return await new Promise<{ default: ComponentType<P> }>(() => {})
      }
      throw err
    }
  })
}
