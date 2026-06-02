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
import { cn } from "@/lib/utils"
import type { MailFolder, MailCategory, MailCounts } from "@/lib/queries/email.queries"

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"

interface Folder {
  key: MailFolder
  label: string
  icon: LucideIcon
}

const FOLDERS: Folder[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
  { key: "important", label: "Important", icon: Star },
  { key: "draft", label: "Drafts", icon: FileText },
  { key: "trash", label: "Trash", icon: Trash2 },
]

const CATEGORIES: { key: MailCategory; label: string; dot: string }[] = [
  { key: "work", label: "Work", dot: "bg-destructive" },
  { key: "private", label: "Private", dot: "bg-primary" },
  { key: "support", label: "Support", dot: "bg-success" },
  { key: "social", label: "Social", dot: "bg-teal-500" },
]

interface MailSidebarProps {
  active: MailFolder
  onSelectFolder: (folder: MailFolder) => void
  category: MailCategory | "all"
  onSelectCategory: (category: MailCategory | "all") => void
  counts?: MailCounts
  onCompose: () => void
}

/** Interactive webmail rail: folders and labels both filter the list. */
export default function MailSidebar({
  active,
  onSelectFolder,
  category,
  onSelectCategory,
  counts,
  onCompose,
}: MailSidebarProps) {
  return (
    <aside className="w-full shrink-0 space-y-3 md:w-60">
      <Button
        onClick={onCompose}
        className={cn(
          "h-12 w-full justify-center gap-2 rounded-full bg-brand-navy text-sm font-semibold text-white shadow-sm hover:bg-brand-navy-dark",
          FOCUS_RING,
        )}
      >
        <PenSquare className="size-4" />
        Compose
      </Button>

      <nav className="rounded-xl border border-border bg-card p-1.5">
        <ul className="space-y-0.5">
          {FOLDERS.map((f) => {
            const isActive = f.key === active
            const count = counts?.[f.key]
            // The Inbox count is unread mail, so it carries a gold accent; the
            // other folders show a plain total in muted grey.
            const accent = f.key === "inbox" || f.key === "important"
            return (
              <li key={f.key}>
                <button
                  type="button"
                  onClick={() => onSelectFolder(f.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-brand-navy/10 font-semibold text-brand-navy"
                      : "font-medium text-foreground hover:bg-muted",
                    FOCUS_RING,
                  )}
                >
                  <f.icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "text-brand-navy" : "text-muted-foreground",
                    )}
                  />
                  <span className="flex-1 truncate text-left">{f.label}</span>
                  {count != null && count > 0 && (
                    <span
                      className={cn(
                        "shrink-0 text-xs tabular-nums",
                        isActive
                          ? "font-semibold text-brand-navy"
                          : accent
                            ? "font-semibold text-brand-navy"
                            : "text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="rounded-xl border border-border bg-card p-2">
        <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Categories
        </p>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => onSelectCategory("all")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors",
                category === "all" ? "bg-muted font-medium" : "hover:bg-muted",
                FOCUS_RING,
              )}
            >
              <span className="size-2.5 shrink-0 rounded-full bg-muted-foreground" />
              <span className="truncate">All labels</span>
            </button>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onSelectCategory(category === c.key ? "all" : c.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  category === c.key ? "bg-muted font-medium" : "hover:bg-muted",
                  FOCUS_RING,
                )}
              >
                <span className={cn("size-2.5 shrink-0 rounded-full", c.dot)} />
                <span className="truncate">{c.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
