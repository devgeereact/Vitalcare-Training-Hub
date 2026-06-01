import { UsersRound } from "lucide-react"
import PlannedModule from "@/components/platform/PlannedModule"

export default function CohortsPage() {
  return (
    <PlannedModule
      icon={UsersRound}
      title="Cohorts & teams"
      description="Group learners for shared enrolment, scheduling and reporting."
      features={[
        "Create cohorts by intake, site or department",
        "Bulk-enrol a cohort onto courses, paths or sessions",
        "Cohort-level progress and compliance reporting",
        "Assign a trainer or manager as cohort lead",
      ]}
    />
  )
}
