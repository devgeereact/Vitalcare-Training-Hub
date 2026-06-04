import { useNavigate } from "react-router-dom"
import { Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useDuplicateCourse } from "@/lib/queries/courses.queries"

/** Clone a course and open the builder on the new draft. */
export default function DuplicateCourseButton({ id }: { id: string }) {
  const dup = useDuplicateCourse()
  const navigate = useNavigate()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      aria-label="Duplicate course"
      title="Duplicate"
      disabled={dup.isPending}
      onClick={() =>
        dup
          .mutateAsync(id)
          .then((newId) => {
            toast.success("Course duplicated", {
              description: "Opening the new draft.",
            })
            navigate(`/platform/courses/builder/${newId}`)
          })
          .catch(() => toast.error("Could not duplicate the course"))
      }
    >
      {dup.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  )
}
