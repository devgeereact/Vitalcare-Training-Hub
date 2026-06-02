import { Link } from "react-router-dom"
import { BookOpen, Clock, Award, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, formatCourseDuration } from "@/lib/utils"
import { driveImageUrl } from "@/lib/drive-image"

export interface CourseCardProps {
  title: string
  /**
   * Where the primary button links to. Used only when `onView` is not
   * supplied; when `onView` is provided the card opens a preview instead of
   * navigating.
   */
  href?: string
  /**
   * Optional click handler for the thumbnail, title, and primary button. When
   * set, the card behaves as a button that opens a preview rather than a link
   * that navigates away. Takes precedence over `href`.
   */
  onView?: () => void
  categoryName?: string | null
  cpdHours?: number | null
  durationMins?: number | null
  cstf?: boolean
  thumbnailUrl?: string | null
  /** Button label. Defaults to "View course". */
  ctaLabel?: string
  className?: string
}

/**
 * Reusable course card: thumbnail header, title, category, meta rows
 * (CPD hours, duration), an optional CSTF-aligned badge, and a primary CTA.
 */
export function CourseCard({
  title,
  href,
  onView,
  categoryName,
  cpdHours,
  durationMins,
  cstf = false,
  thumbnailUrl,
  ctaLabel = "View course",
  className,
}: CourseCardProps): React.ReactElement {
  // driveImageUrl passes plain http(s) URLs through untouched and converts
  // Google Drive links into <img>-safe CDN URLs.
  const thumb = driveImageUrl(thumbnailUrl, 600)

  const mediaClass =
    "block aspect-video w-full overflow-hidden bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
  const media = thumb ? (
    <img
      src={thumb}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
      <BookOpen className="size-7" aria-hidden />
    </div>
  )

  const titleClass =
    "rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden border-border transition-transform duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md",
        className,
      )}
    >
      {onView ? (
        <button type="button" onClick={onView} className={mediaClass} aria-label={title}>
          {media}
        </button>
      ) : (
        <Link to={href ?? "#"} className={mediaClass} aria-label={title}>
          {media}
        </Link>
      )}

      <div className="flex flex-1 flex-col p-4">
        {categoryName ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-gold">
            {categoryName}
          </p>
        ) : null}

        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-brand-navy">
          {onView ? (
            <button type="button" onClick={onView} className={titleClass}>
              {title}
            </button>
          ) : (
            <Link to={href ?? "#"} className={titleClass}>
              {title}
            </Link>
          )}
        </h3>

        <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          {durationMins != null ? (
            <div className="flex items-center gap-2">
              <Clock className="size-4 shrink-0 text-brand-navy/60" aria-hidden />
              <dt className="sr-only">Duration</dt>
              <dd>{formatCourseDuration(durationMins)}</dd>
            </div>
          ) : null}
          {cpdHours != null ? (
            <div className="flex items-center gap-2">
              <Award className="size-4 shrink-0 text-brand-navy/60" aria-hidden />
              <dt className="sr-only">CPD hours</dt>
              <dd>{cpdHours} CPD hours</dd>
            </div>
          ) : null}
        </dl>

        {cstf ? (
          <div className="mt-3">
            <Badge
              variant="outline"
              className="gap-1 border-success/30 bg-success/10 text-success"
            >
              <ShieldCheck className="size-3" aria-hidden /> CSTF aligned
            </Badge>
          </div>
        ) : null}

        <div className="mt-4 pt-1">
          {onView ? (
            <button
              type="button"
              onClick={onView}
              className="inline-flex w-full items-center justify-center rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              {ctaLabel}
            </button>
          ) : (
            <Link
              to={href ?? "#"}
              className="inline-flex w-full items-center justify-center rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}
