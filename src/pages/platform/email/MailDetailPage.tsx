import { Navigate } from "react-router-dom"

/** Mail detail is now shown inline in the unified Email webmail. */
export default function MailDetailPage() {
  return <Navigate to="/platform/email" replace />
}
