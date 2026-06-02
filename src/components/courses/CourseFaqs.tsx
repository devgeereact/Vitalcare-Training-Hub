import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useFaqs } from "@/lib/queries/course-extras.queries"

export default function CourseFaqs({ courseId }: { courseId: string }) {
  const { data, isLoading } = useFaqs(courseId)
  if (isLoading || (data?.length ?? 0) === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently asked questions</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {data!.map((f) => (
          <details key={f.id} className="group py-3 first:pt-0 last:pb-0">
            <summary className="cursor-pointer list-none text-sm font-medium marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold">
              <span className="flex items-center justify-between gap-2">
                {f.question}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {f.answer}
            </p>
          </details>
        ))}
      </CardContent>
    </Card>
  )
}
