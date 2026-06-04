import { Navigate } from "react-router-dom"

/**
 * The standalone Holidays page has been retired. Company closures now live in the
 * Organisation area (Departments page). This route redirects there so any
 * lingering link still resolves.
 */
export default function HolidaysPage(): React.JSX.Element {
  return <Navigate to="/platform/departments" replace />
}
