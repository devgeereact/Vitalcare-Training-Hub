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
  { key: "draft", label: "Draft", icon: FileText },
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
    <aside className="w-full shrink-0 space-y-4 md:w-60">
      <Button
        onClick={onCompose}
        className={cn("h-11 w-full justify-center gap-2 text-sm font-semibold", FOCUS_RING)}
      >
        <PenSquare className="size-4" />
        Compose
      </Button>

      <nav className="rounded-xl border border-border bg-card p-2">
        <ul className="space-y-0.5">
          {FOLDERS.map((f) => {
            const isActive = f.key === active
            const count = counts?.[f.key]
            return (
              <li key={f.key}>
                <button
                  type="button"
                  onClick={() => onSelectFolder(f.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-navy/10 text-brand-navy"
                      : "text-foreground hover:bg-muted",
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
                </button>
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
