import { useEffect, useRef, useState } from "react"

interface UseIdleOptions {
  /** Idle timeout in milliseconds before the user is considered idle. */
  timeout: number
  /** When true, activity tracking is paused and the timer will not run. */
  paused?: boolean
  /**
   * If the tab is hidden for longer than this (ms), returning to the tab is
   * treated as idle immediately. Defaults to the same value as `timeout`.
   */
  awayTimeout?: number
}

const ACTIVITY_EVENTS: ReadonlyArray<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "click",
  "keydown",
  "scroll",
  "touchstart",
  "wheel",
]

/**
 * Tracks user activity and reports whether the user has gone idle.
 *
 * Activity events are debounced so they do not reset the timer on every
 * pixel of mouse movement. When the tab is returned to after a long absence,
 * the user is treated as idle straight away.
 */
export function useIdle({
  timeout,
  paused = false,
  awayTimeout,
}: UseIdleOptions): { idle: boolean; reset: () => void } {
  const [idle, setIdle] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const debounceRef = useRef<number>(0)

  // Keep a stable reset handler via ref so listeners do not re-bind on render.
  const resetRef = useRef<() => void>(() => undefined)

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    const start = (): void => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setIdle(true), timeout)
    }

    const reset = (): void => {
      lastActivityRef.current = Date.now()
      setIdle(false)
      start()
    }
    resetRef.current = reset

    const onActivity = (): void => {
      const now = Date.now()
      // Debounce: ignore bursts of events within a short window.
      if (now - debounceRef.current < 500) return
      debounceRef.current = now
      lastActivityRef.current = now
      // Only restart the timer; do not flip an already-idle state back.
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setIdle(true), timeout)
    }

    const onVisibility = (): void => {
      if (document.visibilityState !== "visible") return
      const awayFor = Date.now() - lastActivityRef.current
      if (awayFor >= (awayTimeout ?? timeout)) {
        setIdle(true)
      }
    }

    start()
    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, onActivity, { passive: true })
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, onActivity)
      }
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [timeout, paused, awayTimeout])

  return {
    idle,
    reset: () => resetRef.current(),
  }
}
