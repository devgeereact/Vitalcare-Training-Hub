import { Link, useLocation } from "react-router-dom"
import { Hammer } from "lucide-react"
import { Button } from "@/components/ui/button"

const SECTION_LABELS: Record<string, string> = {
  courses: "Course management",
  enrolments: "Enrolments",
  assessments: "Assessments",
  calendar: "Calendar",
  sessions: "Sessions",
  attendance: "Attendance",
  certificates: "Certificates",
  learners: "Learner management",
  trainers: "Trainer management",
  notifications: "Notifications",
  messages: "Messages",
  announcements: "Announcements",
  virtual: "Virtual training",
  ai: "AI Assistant",
  analytics: "Analytics",
  payments: "Payments",
  settings: "Settings",
  audit: "Audit log",
}

export default function ModuleComingSoon() {
  const { pathname } = useLocation()
  const key = pathname.replace("/platform/", "").split("/")[0]
  const title = SECTION_LABELS[key] ?? "This module"

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Hammer className="size-8" />
      </div>
      <h1 className="mt-6 font-display text-3xl text-foreground">
        {title} is in development
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        This area of the platform is being built. The navigation and shell are
        ready, and the module will appear here once its phase is complete.
      </p>
      <Button asChild className="mt-6">
        <Link to="/platform/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}
