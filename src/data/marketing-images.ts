/**
 * Curated marketing photography.
 *
 * Single source of truth for the public site's imagery so every page draws from
 * the same hand-picked, professional healthcare set with consistent treatment.
 * Each entry carries descriptive alt text. URLs are built at the size needed.
 */

export interface MarketingImage {
  /** Unsplash photo id (the part after `photo-`). */
  id: string
  /** Descriptive alt text. UK English, no marketing fluff. */
  alt: string
}

/** Build an optimised Unsplash URL at a given width. */
function buildUrl(id: string, width = 1400, quality = 70): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=${quality}`
}

/** The curated set. Keys are semantic, not photo ids. */
export const IMAGES = {
  clinicalReview: {
    id: "1666214280557-f1b5022eb634",
    alt: "Two clinicians reviewing a scan together on screen",
  },
  consultation: {
    id: "1631217868264-e5b90bb7e133",
    alt: "A clinician talking with a patient during a consultation",
  },
  onlineLearning: {
    id: "1522202176988-66273c2fd55f",
    alt: "A healthcare professional learning online beside a stethoscope",
  },
  nurseCare: {
    id: "1559839734-2b71ea197ec2",
    alt: "A nurse supporting a patient in a care setting",
  },
  clinicalTraining: {
    id: "1576091160550-2173dba999ef",
    alt: "Healthcare professionals in a clinical training session",
  },
  infectionControl: {
    id: "1584820927498-cfe5211fd8bf",
    alt: "A clinician putting on protective gloves",
  },
  professional: {
    id: "1612349317150-e413f6a5b16d",
    alt: "A healthcare professional in a clinical portrait",
  },
  nursePortrait: {
    id: "1591604021695-0c69b7c05981",
    alt: "A nurse in a surgical cap and mask",
  },
  stethoscope: {
    id: "1638202993928-7267aad84c31",
    alt: "A clinician holding a stethoscope",
  },
} as const satisfies Record<string, MarketingImage>

export type ImageKey = keyof typeof IMAGES

/** Optimised URL for a curated image at the requested width. */
export function img(key: ImageKey, width = 1400): string {
  return buildUrl(IMAGES[key].id, width)
}

/** Alt text for a curated image. */
export function imgAlt(key: ImageKey): string {
  return IMAGES[key].alt
}

/** Sector hero mapping for /training-solutions/:sector. */
export const SECTOR_IMAGE: Record<string, ImageKey> = {
  "nhs-trusts": "clinicalReview",
  "care-homes": "nurseCare",
  "gp-practices": "consultation",
  "individual-professionals": "professional",
  "group-corporate": "clinicalTraining",
}

/** Rotation used to give each course category a distinct, on-brand hero. */
export const CATEGORY_HERO_ROTATION: ImageKey[] = [
  "clinicalTraining",
  "clinicalReview",
  "onlineLearning",
  "nurseCare",
  "consultation",
  "infectionControl",
]

/** Deterministic hero image key for a category index. */
export function categoryHero(index: number): ImageKey {
  return CATEGORY_HERO_ROTATION[index % CATEGORY_HERO_ROTATION.length]
}
