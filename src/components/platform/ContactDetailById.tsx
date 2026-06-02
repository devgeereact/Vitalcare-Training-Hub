import ContactDetailDialog from "@/components/platform/ContactDetailDialog"
import { useProfileById } from "@/lib/queries/users.queries"

/**
 * Opens the contact detail dialog for a user id, fetching the full profile.
 * Read-only by default. Pass `manageable` only where editing should be allowed
 * (the All accounts page).
 */
export default function ContactDetailById({
  userId,
  onClose,
  manageable = false,
}: {
  userId: string | null
  onClose: () => void
  manageable?: boolean
}) {
  const { data } = useProfileById(userId)
  return (
    <ContactDetailDialog
      user={data ?? null}
      open={!!userId}
      onOpenChange={(o) => !o && onClose()}
      manageable={manageable}
    />
  )
}
