import { Link } from "react-router-dom"
import {
  Inbox,
  Send,
  Star,
  FileText,
  Trash2,
  PenSquare,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Visual webmail navigation rail.
 *
 * Only "Inbox" maps to a live route. The remaining folders and the category
 * list are presentational scaffold: the platform does not yet track Sent,
 * Important, Draft or Trash as separate stores, so these render as inert
 * markers rather than dead handlers that would error.
 */

type FolderKey = "inbox" | "sent" | "important" | "draft" | "trash"

interface Folder {
  key: FolderKey
  label: string
  icon: LucideIcon
  to?: string
  count?: number
}

interface Category {
  label: string
  dot: string
}

const FOLDERS: Folder[] = [
  { key: "inbox", label: "Inbox", icon: Inbox, to: "/platform/inbox" },
  { key: "sent", label: "Sent", icon: Send },
  { key: "important", label: "Important", icon: Star },
  { key: "draft", label: "Draft", icon: FileText },
  { key: "trash", label: "Trash", icon: Trash2 },
]

const CATEGORIES: Category[] = [
  { label: "Work", dot: "bg-destructive" },
  { label: "Private", dot: "bg-primary" },
  { label: "Support", dot: "bg-success" },
  { label: "Social", dot: "bg-teal-500" },
]

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"

interface MailSidebarProps {
  /** Highlights the active folder row. Defaults to Inbox. */
  active?: FolderKey
  /** Unread count shown against the Inbox row. */
  inboxCount?: number
}

export default function MailSidebar({ active = "inbox", inboxCount }: MailSidebarProps) {
  return (
    <aside className="w-full shrink-0 space-y-4 md:w-60">
      <Button asChild className="h-11 w-full justify-center gap-2 text-sm font-semibold">
        <Link to="/platform/email" className={FOCUS_RING}>
          <PenSquare className="size-4" />
          Compose
        </Link>
      </Button>

      <nav className="rounded-xl border border-border bg-card p-2">
        <ul className="space-y-0.5">
          {FOLDERS.map((f) => {
            const isActive = f.key === active
            const count = f.key === "inbox" ? inboxCount : f.count
            const rowClass = cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-navy/10 text-brand-navy"
                : "text-foreground hover:bg-muted",
            )
            const inner = (
              <>
                <f.icon className={cn("size-4 shrink-0", isActive ? "text-brand-navy" : "text-muted-foreground")} />
                <span className="flex-1 truncate">{f.label}</span>
                {count != null && count > 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-5 min-w-5 justify-center px-1.5 text-xs",
                      isActive ? "bg-brand-navy text-white" : "",
                    )}
                  >
                    {count}
                  </Badge>
                )}
              </>
            )
            return (
              <li key={f.key}>
                {f.to ? (
                  <Link
                    to={f.to}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(rowClass, FOCUS_RING)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <span className={cn(rowClass, "cursor-default text-muted-foreground")} aria-disabled>
                    {inner}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="rounded-xl border border-border bg-card p-3">
        <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Categories
        </p>
        <ul className="space-y-0.5">
          {CATEGORIES.map((c) => (
            <li
              key={c.label}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-foreground"
            >
              <span className={cn("size-2.5 shrink-0 rounded-full", c.dot)} />
              <span className="truncate">{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
