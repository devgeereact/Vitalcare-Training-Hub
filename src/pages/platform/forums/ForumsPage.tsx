import { MessagesSquare } from "lucide-react"
import PlannedModule from "@/components/platform/PlannedModule"

export default function ForumsPage() {
  return (
    <PlannedModule
      icon={MessagesSquare}
      title="Forums"
      description="Course discussion boards for learners and trainers."
      features={[
        "Threaded discussions attached to each course",
        "Trainer-moderated questions and answers",
        "Pin announcements and mark resolved replies",
        "Notifications for new replies on threads you follow",
      ]}
    />
  )
}
