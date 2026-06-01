import { Route } from "lucide-react"
import PlannedModule from "@/components/platform/PlannedModule"

export default function LearningPathsPage() {
  return (
    <PlannedModule
      icon={Route}
      title="Learning paths"
      description="Sequence courses into structured pathways for each role."
      features={[
        "Group courses into ordered paths by job role or CSTF requirement",
        "Enrol whole cohorts onto a path in one step",
        "Track path completion and certificate eligibility",
        "Set prerequisites and unlock rules between stages",
      ]}
    />
  )
}
