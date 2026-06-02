import { Navigate } from "react-router-dom"

/** Inbox is merged into the unified Email webmail at /platform/email. */
export default function InboxPage() {
  return <Navigate to="/platform/email" replace />
}
