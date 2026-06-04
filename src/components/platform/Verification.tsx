import { BadgeCheck, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSetVerification } from "@/lib/queries/verification.queries"

/**
 * Gold tick shown beside a verified staff member or trainer. Renders nothing
 * when the user is not verified, so callers can drop it in unconditionally.
 */
export function VerifiedTick({
  verified,
  className,
}: {
  verified: boolean
  className?: string
}): React.JSX.Element | null {
  if (!verified) return null
  return (
    <span
      className={cn("inline-flex shrink-0", className)}
      aria-label="Verified by a super admin"
      title="Verified by a super admin"
      role="img"
    >
      <BadgeCheck className="size-4 text-brand-gold" />
    </span>
  )
}

/**
 * Super-admin-only control to verify or revoke a user. Only render this for a
 * super admin; the database also rejects the call for anyone else. Clearing an
 * existing verification asks for confirmation first.
 */
export function VerifyControl({
  userId,
  verified,
  name,
}: {
  userId: string
  verified: boolean
  name: string
}): React.JSX.Element {
  const set = useSetVerification()

  function toggle() {
    if (verified) {
      if (!confirm(`Remove the verified badge from ${name}?`)) return
    }
    set
      .mutateAsync({ userId, verified: !verified })
      .then(() =>
        toast.success(verified ? "Verification removed" : `${name} verified`),
      )
      .catch((e: unknown) =>
        toast.error(
          e instanceof Error ? e.message : "Could not update verification",
        ),
      )
  }

  return (
    <Button
      variant={verified ? "ghost" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={set.isPending}
      className={verified ? "text-muted-foreground" : ""}
    >
      {set.isPending ? (
        <Loader2 className="mr-1.5 size-4 animate-spin" />
      ) : (
        <ShieldCheck className="mr-1.5 size-4" />
      )}
      {verified ? "Verified" : "Verify"}
    </Button>
  )
}
