import type { ReactNode } from "react"
import { motion, useReducedMotion, type Variants } from "framer-motion"

/** A small headline statistic shown beneath an image hero. */
export interface HeroStat {
  value: string
  label: string
}

/**
 * Interior page title banner.
 *
 * Calm navy band with a single soft glow and a gold hairline, clean DM Sans
 * type and consistent rhythm on every page. `title` is the only required prop.
 * Passing an `imageUrl` upgrades it to a balanced two-column layout with a
 * refined photo frame and optional stat chips. The homepage uses its own hero;
 * every other marketing page uses this for visual consistency.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  imageUrl,
  imageAlt = "Vitalcare healthcare training",
  stats,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
  imageUrl?: string
  imageAlt?: string
  stats?: HeroStat[]
}) {
  const reduce = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.03 },
    },
  }
  const item: Variants = {
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.5, ease: [0.21, 0.47, 0.32, 0.98] },
    },
  }

  const hasImage = Boolean(imageUrl)

  return (
    <section className="relative overflow-hidden bg-brand-navy">
      {/* Calm navy gradient, one soft gold glow, gold hairline. No busy texture. */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#1b2e6b] via-[#16265a] to-[#0f1b41]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-28 -top-32 size-[26rem] rounded-full bg-brand-gold/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent"
        aria-hidden="true"
      />

      <div
        className={
          hasImage
            ? "relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24"
            : "relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        }
      >
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className={hasImage ? "max-w-xl" : "max-w-3xl"}
        >
          {eyebrow ? (
            <motion.p
              variants={item}
              className="inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-brand-gold"
            >
              <span className="h-px w-8 bg-brand-gold/70" aria-hidden="true" />
              {eyebrow}
            </motion.p>
          ) : null}

          <motion.h1
            variants={item}
            className="mt-4 font-sans font-semibold tracking-tight text-4xl leading-[1.1] text-white sm:text-5xl"
          >
            {title}
          </motion.h1>

          {description ? (
            <motion.p
              variants={item}
              className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75"
            >
              {description}
            </motion.p>
          ) : null}

          {children ? (
            <motion.div variants={item} className="mt-8">
              {children}
            </motion.div>
          ) : null}
        </motion.div>

        {hasImage ? (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98], delay: 0.12 }}
            className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto lg:max-w-none"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
              <img
                src={imageUrl}
                alt={imageAlt}
                loading="eager"
                className="aspect-[5/4] w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark/30 via-transparent to-transparent"
                aria-hidden="true"
              />
            </div>

            {stats && stats.length > 0 ? (
              <div className="absolute -bottom-5 left-4 right-4 flex gap-3 sm:left-auto sm:right-6">
                {stats.slice(0, 2).map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.4 + i * 0.1,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                    className="flex-1 rounded-xl border border-border bg-white/95 px-5 py-4 shadow-lg backdrop-blur sm:flex-none"
                  >
                    <p className="font-sans text-2xl font-semibold leading-none tracking-tight text-brand-navy">
                      {stat.value}
                    </p>
                    <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </div>
    </section>
  )
}
