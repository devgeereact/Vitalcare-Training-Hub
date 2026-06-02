import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"
import {
  useMyBookedSessions,
  useMarkSelfAttendance,
} from "@/lib/queries/attendance.queries"

/**
 * On login / app load, automatically marks the learner present for any session
 * they are booked on that is happening right now and not yet marked. Mounted
 * once in the platform shell.
 */
export default function AutoAttendance() {
  const { user } = useAuth()
  const { data } = useMyBookedSessions(user?.id)
  const mark = useMarkSelfAttendance(user?.id)
  const done = useRef(new Set<string>())

  useEffect(() => {
    if (!data) return
    const now = Date.now()
    for (const s of data) {
      const start = new Date(s.startsAt).getTime()
      const end = new Date(s.endsAt).getTime()
      const inProgress = now >= start && now <= end
      if (inProgress && !s.attendance && !done.current.has(s.sessionId)) {
        done.current.add(s.sessionId)
        mark
          .mutateAsync(s.sessionId)
          .then(() => toast.success(`Attendance marked: ${s.title}`))
          .catch(() => done.current.delete(s.sessionId))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return null
}
