import { CalendarOff } from "lucide-react"
import PlannedModule from "@/components/platform/PlannedModule"

export default function HolidaysPage() {
  return (
    <PlannedModule
      icon={CalendarOff}
      title="Holidays"
      description="Block out non-working days so scheduling avoids them."
      features={[
        "Add bank holidays and organisation closure dates",
        "Sessions and reminders skip blocked dates automatically",
        "Per-trainer leave so availability stays accurate",
        "Year view of all scheduled closures",
      ]}
    />
  )
}
