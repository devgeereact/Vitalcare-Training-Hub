import type { ReactNode } from "react"

/**
 * Shared "Authoring" heading rendered at the top of Course Builder, Quiz Builder
 * and Resources. The segmented sub-navigation is provided by SectionTabs in the
 * app layout, so this only renders the heading.
 */
export default function AuthoringHeader(): ReactNode {
  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">Authoring</h1>
      <p className="mt-1 text-muted-foreground">
        Build courses, quizzes and shared resources in one place.
      </p>
    </div>
  )
}
