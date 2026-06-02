import ContactDetailDialog from "@/components/platform/ContactDetailDialog"
import { useProfileById } from "@/lib/queries/users.queries"

/** Opens the contact detail dialog for a user id, fetching the full profile. */
export default function ContactDetailById({
  userId,
  onClose,
}: {
  userId: string | null
  onClose: () => void
}) {
  const { data } = useProfileById(userId)
  return (
    <ContactDetailDialog
      user={data ?? null}
      open={!!userId}
      onOpenChange={(o) => !o && onClose()}
    />
  )
}
