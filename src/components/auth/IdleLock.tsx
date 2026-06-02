import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Lock, LogOut } from "lucide-react"

import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { useIdle } from "@/hooks/use-idle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** Idle timeout before the session locks. Fifteen minutes. */
const IDLE_TIMEOUT_MS = 15 * 60 * 1000
/** Returning to the tab after this long away locks immediately. */
const AWAY_TIMEOUT_MS = 5 * 60 * 1000
/** sessionStorage key so a refresh while locked stays locked. */
const LOCK_STORAGE_KEY = "vitalcare-session-locked"
/** Number of failed attempts before a short cooldown is applied. */
const ATTEMPTS_BEFORE_DELAY = 3
/** Cooldown length, in milliseconds, once attempts are exceeded. */
const COOLDOWN_MS = 5000

interface IdleLockContextValue {
  /** Lock the session immediately. */
  lock: () => void
  /** Whether the session is currently locked. */
  locked: boolean
}

const IdleLockContext = createContext<IdleLockContextValue | undefined>(
  undefined,
)

/** Programmatically lock the session, e.g. from a "Lock now" menu item. */
export function useIdleLock(): IdleLockContextValue {
  const context = useContext(IdleLockContext)
  if (context === undefined) {
    throw new Error("useIdleLock must be used within <IdleLockProvider>")
  }
  return context
}

function readPersistedLock(): boolean {
  try {
    return sessionStorage.getItem(LOCK_STORAGE_KEY) === "1"
  } catch {
    // sessionStorage can be unavailable (private mode, blocked). Fail open.
    return false
  }
}

function persistLock(value: boolean): void {
  try {
    if (value) {
      sessionStorage.setItem(LOCK_STORAGE_KEY, "1")
    } else {
      sessionStorage.removeItem(LOCK_STORAGE_KEY)
    }
  } catch (error) {
    console.error("[IdleLock] failed to persist lock state", error)
  }
}

function initials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ""
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
    return (first + last).toUpperCase() || "VC"
  }
  if (email) return email[0]?.toUpperCase() ?? "VC"
  return "VC"
}

interface IdleLockProviderProps {
  children: ReactNode
}

/**
 * Mounts an idle lock over the platform shell. After a period of inactivity
 * the overlay covers the app and the user must re-enter their password to
 * resume. The Supabase session stays valid underneath; this is a UX lock.
 */
export function IdleLockProvider({
  children,
}: IdleLockProviderProps): React.JSX.Element {
  const { user, profile, signOut, loading } = useAuth()
  const authenticated = Boolean(user) && !loading

  const [locked, setLocked] = useState<boolean>(
    () => authenticated && readPersistedLock(),
  )

  const { idle, reset } = useIdle({
    timeout: IDLE_TIMEOUT_MS,
    awayTimeout: AWAY_TIMEOUT_MS,
    // Pause tracking while signed out or already locked.
    paused: !authenticated || locked,
  })

  const lock = useCallback((): void => {
    setLocked(true)
    persistLock(true)
  }, [])

  const unlock = useCallback((): void => {
    setLocked(false)
    persistLock(false)
    reset()
  }, [reset])

  // Lock when the idle hook reports inactivity.
  useEffect(() => {
    if (idle && authenticated && !locked) lock()
  }, [idle, authenticated, locked, lock])

  // If the user signs out, clear any persisted lock.
  useEffect(() => {
    if (!authenticated) {
      setLocked(false)
      persistLock(false)
    }
  }, [authenticated])

  const contextValue: IdleLockContextValue = { lock, locked }

  return (
    <IdleLockContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {locked && authenticated ? (
          <LockScreen
            name={profile?.full_name ?? null}
            email={user?.email ?? profile?.email ?? null}
            avatarUrl={profile?.avatar_url ?? null}
            onUnlock={unlock}
            onSignOut={signOut}
          />
        ) : null}
      </AnimatePresence>
    </IdleLockContext.Provider>
  )
}

interface LockScreenProps {
  name: string | null
  email: string | null
  avatarUrl: string | null
  onUnlock: () => void
  onSignOut: () => Promise<void>
}

function LockScreen({
  name,
  email,
  avatarUrl,
  onUnlock,
  onSignOut,
}: LockScreenProps): React.JSX.Element {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const attemptsRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the password field as soon as the lock appears.
  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(id)
  }, [])

  // Prevent the page beneath from scrolling while locked.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent): Promise<void> => {
      event.preventDefault()
      if (submitting) return

      if (Date.now() < cooldownUntil) {
        const seconds = Math.ceil((cooldownUntil - Date.now()) / 1000)
        setError(`Too many attempts. Please wait ${seconds} seconds.`)
        return
      }
      if (!password) {
        setError("Enter your password to unlock.")
        return
      }
      if (!email) {
        setError("Unable to verify this session. Please sign out and back in.")
        return
      }

      setSubmitting(true)
      setError(null)
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) {
          attemptsRef.current += 1
          if (attemptsRef.current >= ATTEMPTS_BEFORE_DELAY) {
            setCooldownUntil(Date.now() + COOLDOWN_MS)
            attemptsRef.current = 0
          }
          // Do not reveal whether the email exists or the exact failure.
          setError("Incorrect password. Please try again.")
          setPassword("")
          inputRef.current?.focus()
          return
        }
        attemptsRef.current = 0
        setPassword("")
        onUnlock()
      } catch (err) {
        console.error("[IdleLock] unlock failed", err)
        setError("Something went wrong. Please try again.")
      } finally {
        setSubmitting(false)
      }
    },
    [submitting, cooldownUntil, password, email, onUnlock],
  )

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      persistLock(false)
      await onSignOut()
    } catch (err) {
      console.error("[IdleLock] sign out failed", err)
    }
  }, [onSignOut])

  const displayName = name ?? email ?? "your account"

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Session locked"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1b2e6b]/90 px-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/logos/logo-round-navy.svg"
            alt="Vitalcare Training Hub"
            width={56}
            height={56}
            className="mb-5 h-14 w-14"
          />

          <div className="relative mb-4">
            <Avatar className="h-16 w-16 border-2 border-[#d4a843]">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="bg-[#1b2e6b] text-white">
                {initials(name, email)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#d4a843] text-[#1b2e6b] shadow">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>

          <h2 className="font-display text-2xl text-[#1b2e6b]">
            Session locked
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as{" "}
            <span className="font-medium text-slate-700">{displayName}</span>.
            Enter your password to resume.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="idle-lock-password" className="text-slate-700">
              Password
            </Label>
            <Input
              id="idle-lock-password"
              ref={inputRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (error) setError(null)
              }}
              disabled={submitting}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "idle-lock-error" : undefined}
              className="focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
            />
          </div>

          {error ? (
            <p
              id="idle-lock-error"
              role="alert"
              className="text-sm text-red-600"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1b2e6b] text-white hover:bg-[#142054] focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Verifying
              </>
            ) : (
              "Unlock"
            )}
          </Button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 underline-offset-4 transition-colors hover:text-[#1b2e6b] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign out instead
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
