import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, CircleSlash, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { getCurriculum, coursesKeys } from "@/lib/queries/courses.queries"
import { curriculumReadiness } from "@/lib/courses/readiness"

/** One-click publish / unpublish from the manage table. Publishing is gated on
 *  curriculum readiness; unpublishing is always allowed. */
export default function PublishCourseButton({
  id,
  published,
}: {
  id: string
  published: boolean
}) {
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    try {
      if (!published) {
        const mods = await getCurriculum(id)
        const r = curriculumReadiness(mods)
        if (!r.ready) {
          toast.error("Cannot publish yet", {
            description: r.parts.join(", ") || "Add curriculum content first.",
          })
          return
        }
      }
      const { error } = await supabase
        .from("courses")
        .update({ is_published: !published })
        .eq("id", id)
      if (error) throw error
      toast.success(!published ? "Course published" : "Course moved to draft")
      qc.invalidateQueries({ queryKey: coursesKeys.all })
    } catch (err) {
      console.error("[PublishCourseButton]", err)
      toast.error("Could not update the course")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      disabled={busy}
      aria-label={published ? "Unpublish course" : "Publish course"}
      title={published ? "Unpublish" : "Publish"}
      onClick={toggle}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : published ? (
        <CircleSlash className="size-4 text-muted-foreground" />
      ) : (
        <CheckCircle2 className="size-4 text-success" />
      )}
    </Button>
  )
}
