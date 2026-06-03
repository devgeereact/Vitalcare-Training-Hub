import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  HeartHandshake,
  ShieldAlert,
  Stethoscope,
  Activity,
  Brain,
  HardHat,
  GraduationCap,
  Users,
  Cross,
  FileCheck,
  MessagesSquare,
  Flame,
  UtensilsCrossed,
  BookOpen,
  type LucideIcon,
} from "lucide-react"
import { COURSE_CATEGORIES } from "@/data/courses"

const ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  HeartHandshake,
  ShieldAlert,
  Stethoscope,
  Activity,
  Brain,
  HardHat,
  GraduationCap,
  Users,
  Cross,
  FileCheck,
  MessagesSquare,
  Flame,
  UtensilsCrossed,
  BookOpen,
}

/**
 * Responsive grid of the course categories. Shows the first eight, then a
 * "Load more" button reveals the rest in the same scroll (no page change).
 */
export function CategoryGrid({ initialCount = 9 }: { initialCount?: number }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll
    ? COURSE_CATEGORIES
    : COURSE_CATEGORIES.slice(0, initialCount)
  const remaining = COURSE_CATEGORIES.length - initialCount

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((category) => {
          const Icon = ICONS[category.icon] ?? BookOpen
          return (
            <Link
              key={category.id}
              to={`/our-courses/${category.slug}`}
              className="group flex flex-col rounded-xl border border-border bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-200 will-change-transform hover:-translate-y-1 hover:border-brand-gold hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy transition-colors group-hover:bg-brand-gold/15 group-hover:text-brand-gold">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-brand-navy">
                {category.name}
              </h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
                {category.blurb}
              </p>
              <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-gold">
                {category.count} courses
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </p>
            </Link>
          )
        })}
      </div>

      {!showAll && remaining > 0 ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 rounded-md border border-brand-navy/15 bg-white px-6 py-3 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:border-brand-navy/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          >
            Load more categories
            <span className="text-muted-foreground">({remaining})</span>
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
