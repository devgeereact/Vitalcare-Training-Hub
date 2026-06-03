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
    <section className="relative overflow-hidden bg-brand-navy">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={
              i > 0
                ? "text-center lg:border-l lg:border-white/10"
                : "text-center"
            }
          >
            <p className="font-sans font-semibold tracking-tight text-4xl text-white lg:text-5xl">
              {stat.value}
            </p>
            <p className="mt-1.5 text-sm font-medium uppercase tracking-wide text-brand-gold">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
