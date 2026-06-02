import type { ReactNode } from "react"

import AuthoringNav from "@/components/authoring/AuthoringNav"

/**
 * Shared "Authoring" heading area rendered at the top of Course Builder, Quiz
 * Builder and Resources. Pairs the heading with the segmented {@link AuthoringNav}
 * so the three pages read as one area. Each page renders this itself; routes are
 * untouched.
 */
export default function AuthoringHeader(): ReactNode {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="font-display text-3xl text-foreground">Authoring</h1>
        <p className="mt-1 text-muted-foreground">
          Build courses, quizzes and shared resources in one place.
        </p>
      </div>
      <AuthoringNav />
    </div>
  )
}
