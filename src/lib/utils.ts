import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a minute count as a readable duration, e.g. 180 -> "3h 0m", 45 -> "45 min". */
export function formatCourseDuration(mins: number): string {
  if (!mins || mins <= 0) return "Self-paced"
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  return `${hours}h ${rest}m`
}
