import { useState } from "react"
import { toast } from "sonner"
import { Loader2, CloudUpload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useCourse, useCurriculum } from "@/lib/queries/courses.queries"
import { exportCourseToDrive } from "@/lib/courses/drive-export"

/**
 * One-click save of the course's generated artefacts (Full Course + each
 * Assessment) to the admin Google Drive review folder. Workbooks already upload
 * to Drive when added, so they are not duplicated here.
 */
export default function SaveToDriveButton({ courseId }: { courseId: string }) {
  const course = useCourse(courseId)
  const curriculum = useCurriculum(courseId)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!course.data) return
    setBusy(true)
    try {
      const res = await exportCourseToDrive(course.data, curriculum.data ?? [])
      if (res.notConfigured) {
        toast.error("Google Drive not connected", {
          description: "Connect it in Settings, Integrations, then try again.",
        })
      } else if (res.failed > 0) {
        toast.warning(`Saved ${res.uploaded}, ${res.failed} failed`, {
          description: "Some files did not reach Google Drive.",
        })
      } else {
        toast.success(`Saved ${res.uploaded} file${res.uploaded === 1 ? "" : "s"} to Google Drive`, {
          description: "Full course and assessments are in the admin review folder.",
        })
      }
    } catch (err) {
      console.error("[SaveToDriveButton]", err)
      toast.error("Could not save to Google Drive")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy || !course.data}
      onClick={save}
      title="Save the full course and assessments to the admin Google Drive folder"
    >
      {busy ? (
        <Loader2 className="mr-1.5 size-4 animate-spin" />
      ) : (
        <CloudUpload className="mr-1.5 size-4" />
      )}
      Save to Google Drive
    </Button>
  )
}
