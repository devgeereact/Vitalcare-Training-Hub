import { useState, type ReactNode } from "react"
import { format, formatDistanceToNow, isToday } from "date-fns"
import {
  Paperclip,
  Star,
  Trash2,
  MailOpen,
  RotateCcw,
} from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { cleanSnippet } from "@/lib/email/mime"
import type { MailFolder, MailRow, MailCategory } from "@/lib/queries/email.queries"

const CATEGORY_DOT: Record<MailCategory, string> = {
  work: "bg-destructive",
  private: "bg-primary",
  support: "bg-success",
  social: "bg-teal-500",
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-gold"

/** Parse a timestamp safely. Returns null for missing or invalid values so the
 *  list never renders "Invalid Date" or throws inside date-fns. */
function safeDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Gmail-style timestamp: relative for today (e.g. "14:32" style replaced with a
 *  short clock), otherwise a short date. Keeps rows narrow on the right edge. */
function listDate(value: string | null | undefined): string {
  const d = safeDate(value)
  if (!d) return ""
  return isToday(d) ? format(d, "HH:mm") : format(d, "d MMM")
}

/** Longer relative label used as the row title tooltip. */
function fullDate(value: string | null | undefined): string {
  const d = safeDate(value)
  if (!d) return ""
  return isToday(d)
    ? formatDistanceToNow(d, { addSuffix: true })
    : format(d, "EEE d MMM yyyy, HH:mm")
}

function categoryDot(category: string | null): string | null {
  if (!category) return null
  return CATEGORY_DOT[category as MailCategory] ?? null
}

interface MailListRowProps {
  mail: MailRow
  folder: MailFolder
  selected: boolean
  onSelectedChange: (checked: boolean) => void
  onOpen: () => void
  onToggleStar: () => void
  onTrash: () => void
  onRestore: () => void
  onMarkSeen: () => void
}

/** Dense, single-line Gmail-style inbox row.
 *
 *  Leading checkbox + star, sender, then subject with a greyed snippet on the
 *  same line, an attachment clip when present, and a right-aligned date that is
 *  swapped for hover quick-actions. Unread rows render white and bold; read
 *  rows sit subtly on the muted background. */
export default function MailListRow({
  mail,
  folder,
  selected,
  onSelectedChange,
  onOpen,
  onToggleStar,
  onTrash,
  onRestore,
  onMarkSeen,
}: MailListRowProps) {
  const [hovered, setHovered] = useState(false)
  const unread = !mail.seen && mail.folder === "inbox"
  const isTrash = folder === "trash"
  const dot = categoryDot(mail.category)

  const who =
    folder === "sent" || folder === "draft"
      ? `To: ${mail.to_addr || "(no recipient)"}`
      : mail.from_name || mail.from_addr || "Unknown sender"

  const snippet = cleanSnippet(mail.body_text || mail.body_html || mail.snippet)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative flex items-center gap-2 px-3 py-2 transition-colors sm:gap-3 sm:px-4",
        unread ? "bg-card" : "bg-muted/30",
        "hover:z-10 hover:bg-card hover:shadow-sm",
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={selected}
        onCheckedChange={(v) => onSelectedChange(v === true)}
        aria-label={`Select message from ${who}`}
        className="shrink-0 data-[state=checked]:border-brand-navy data-[state=checked]:bg-brand-navy"
      />

      {/* Star toggle */}
      <button
        type="button"
        onClick={onToggleStar}
        aria-pressed={mail.important}
        aria-label={mail.important ? "Remove from Important" : "Mark Important"}
        title={mail.important ? "Remove from Important" : "Mark Important"}
        className={cn(
          "shrink-0 rounded-md p-0.5 text-muted-foreground/60 transition-colors hover:text-brand-gold",
          FOCUS_RING,
        )}
      >
        <Star
          className={cn(
            "size-4",
            mail.important && "fill-brand-gold text-brand-gold",
          )}
        />
      </button>

      {/* Clickable body */}
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 text-left sm:gap-3",
          FOCUS_RING,
          "rounded-md",
        )}
      >
        {/* Unread dot + sender */}
        <span className="flex w-32 shrink-0 items-center gap-1.5 sm:w-44">
          <span
            aria-hidden
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              unread ? "bg-brand-gold" : "bg-transparent",
            )}
          />
          <span
            className={cn(
              "truncate text-sm",
              unread
                ? "font-semibold text-foreground"
                : "font-normal text-muted-foreground",
            )}
          >
            {who}
          </span>
        </span>

        {/* Subject + snippet on one line */}
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          {mail.has_attachments && (
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {dot && (
            <span
              aria-hidden
              className={cn("size-2 shrink-0 rounded-full", dot)}
            />
          )}
          <span
            className={cn(
              "shrink-0 truncate text-sm",
              unread ? "font-semibold text-foreground" : "text-foreground/90",
            )}
          >
            {mail.subject || "(no subject)"}
          </span>
          {snippet && (
            <span className="hidden min-w-0 truncate text-sm text-muted-foreground sm:inline">
              <span aria-hidden>&nbsp;&ndash;&nbsp;</span>
              {snippet}
            </span>
          )}
        </span>

        {/* Date (hidden under hover quick-actions) */}
        <span
          title={fullDate(mail.received_at || mail.created_at)}
          className={cn(
            "ml-auto w-16 shrink-0 text-right text-xs tabular-nums",
            hovered && "invisible",
            unread
              ? "font-semibold text-foreground"
              : "text-muted-foreground",
          )}
        >
          {listDate(mail.received_at || mail.created_at)}
        </span>
      </button>

      {/* Hover quick-actions, overlaid on the date column */}
      <div
        className={cn(
          "absolute inset-y-0 right-2 flex items-center gap-0.5 transition-opacity sm:right-3",
          hovered ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {isTrash ? (
          <QuickAction
            label="Restore"
            onClick={onRestore}
            icon={<RotateCcw className="size-4" />}
          />
        ) : (
          <>
            <QuickAction
              label="Move to Trash"
              onClick={onTrash}
              icon={<Trash2 className="size-4" />}
            />
            <QuickAction
              label={mail.important ? "Remove from Important" : "Mark Important"}
              onClick={onToggleStar}
              icon={
                <Star
                  className={cn(
                    "size-4",
                    mail.important && "fill-brand-gold text-brand-gold",
                  )}
                />
              }
            />
            {unread && (
              <QuickAction
                label="Mark as read"
                onClick={onMarkSeen}
                icon={<MailOpen className="size-4" />}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function QuickAction({
  label,
  onClick,
  icon,
}: {
  label: string
  onClick: () => void
  icon: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-brand-navy",
        FOCUS_RING,
      )}
    >
      {icon}
    </button>
  )
}
