import { Link } from "react-router-dom"
import {
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

/** Responsive grid of the 15 course categories. */
export function CategoryGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {COURSE_CATEGORIES.map((category) => {
        const Icon = ICONS[category.icon] ?? BookOpen
        return (
          <Link
            key={category.id}
            to={`/our-courses/${category.slug}`}
            className="group flex flex-col rounded-xl border border-border bg-white p-6 transition-transform duration-200 will-change-transform hover:-translate-y-1 hover:border-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          >
            <span className="flex size-11 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy transition-colors group-hover:bg-brand-gold/15 group-hover:text-brand-gold">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-brand-navy">
              {category.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{category.blurb}</p>
            <p className="mt-4 text-sm font-medium text-brand-gold">
              {category.count} courses
            </p>
          </Link>
        )
      })}
    </div>
  )
}
