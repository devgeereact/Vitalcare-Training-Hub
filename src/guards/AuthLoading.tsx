/** Full-screen branded loading state shown while the session resolves. */
export function AuthLoading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background">
      <img
        src="/logos/logo-round-navy.svg"
        alt="Vitalcare Training Hub"
        className="size-14 motion-safe:animate-pulse"
      />
      <p className="text-sm text-muted-foreground">Loading your workspace</p>
    </div>
  )
}
