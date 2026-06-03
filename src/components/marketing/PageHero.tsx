import type { ReactNode } from "react"
import { motion, useReducedMotion, type Variants } from "framer-motion"

/** A floating glass stat card overlapping the hero image. */
export interface HeroStat {
  value: string
  label: string
}

/**
 * Premium navy hero used across marketing pages.
 *
 * Backwards compatible: `title` is the only required prop. Interior pages keep
 * the original eyebrow / title / description / children signature. Passing an
 * `imageUrl` upgrades it to the full two-column flagship layout with a masked
 * photo frame, gold ring accent and optional floating stat cards.
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
      transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.04 },
    },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 22 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] },
    },
  }

  const hasImage = Boolean(imageUrl)

  return (
    <section className="relative overflow-hidden bg-brand-navy">
      {/* Rich navy gradient base */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#1b2e6b] via-[#142054] to-[#0d1530]"
        aria-hidden="true"
      />
      {/* Layered gold glows */}
      <div
        className="pointer-events-none absolute -right-32 -top-40 size-[30rem] rounded-full bg-brand-gold/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-brand-gold/10 blur-3xl"
        aria-hidden="true"
      />
      {/* Subtle geometric grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at 30% 20%, black 0%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 30% 20%, black 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent"
        aria-hidden="true"
      />

      <div
        className={
          hasImage
            ? "relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28"
            : "relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        }
      >
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className={hasImage ? "max-w-xl" : ""}
        >
          {eyebrow ? (
            <motion.p
              variants={item}
              className="inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold"
            >
              <span className="h-px w-8 bg-brand-gold/70" aria-hidden="true" />
              {eyebrow}
            </motion.p>
          ) : null}

          <motion.h1
            variants={item}
            className={
              hasImage
                ? "mt-4 font-display text-5xl leading-tight text-white sm:text-6xl lg:text-7xl"
                : "mt-3 max-w-3xl font-display text-4xl leading-tight text-white lg:text-5xl"
            }
          >
            {title}
          </motion.h1>

          {description ? (
            <motion.p
              variants={item}
              className={
                hasImage
                  ? "mt-6 max-w-xl text-lg leading-relaxed text-white/80"
                  : "mt-4 max-w-2xl text-lg leading-relaxed text-white/80"
              }
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
            initial={{ opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98], delay: 0.15 }}
            className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto lg:max-w-none"
          >
            {/* Gold ring accent behind the frame */}
            <div
              className="pointer-events-none absolute -right-4 -top-4 hidden h-full w-full rounded-3xl border-2 border-brand-gold/60 sm:block"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
              <img
                src={imageUrl}
                alt={imageAlt}
                loading="eager"
                className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark/40 via-transparent to-transparent"
                aria-hidden="true"
              />
            </div>

            {/* Floating glass stat cards */}
            {stats && stats.length > 0 ? (
              <div className="absolute -bottom-6 -left-4 flex gap-3 sm:-left-8">
                {stats.slice(0, 2).map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.55,
                      delay: 0.5 + i * 0.12,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                    className="rounded-2xl border border-white/20 bg-white/95 px-5 py-4 shadow-xl backdrop-blur"
                  >
                    <p className="font-display text-2xl leading-none text-brand-navy">
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
