import { TOTAL_COURSE_COUNT, COURSE_CATEGORIES } from "@/data/courses"

const STATS = [
  { value: `${TOTAL_COURSE_COUNT}+`, label: "Courses" },
  { value: `${COURSE_CATEGORIES.length}`, label: "Categories" },
  { value: "CSTF", label: "Aligned" },
  { value: "Verified", label: "Certificates" },
] as const

/** Navy band of headline statistics. */
export function StatsBar() {
  return (
    <section className="bg-brand-navy">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-display text-4xl text-white">{stat.value}</p>
            <p className="mt-1 text-sm uppercase tracking-wide text-brand-gold">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
