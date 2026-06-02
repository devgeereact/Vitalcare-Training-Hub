import { Trash2, RotateCcw, MailOpen, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { MailFolder, MailRow } from "@/lib/queries/email.queries"

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

interface MailListToolbarProps {
  folder: MailFolder
  rows: MailRow[]
  selectedIds: Set<string>
  onSelectAll: (checked: boolean | "indeterminate") => void
  onBulkTrash: () => void
  onBulkRestore: () => void
  onBulkMarkSeen: () => void
  onRefresh: () => void
  refreshing: boolean
}

/** Sticky header strip above the message list. A leading select-all checkbox
 *  (indeterminate when a subset is selected) flips into a bulk-action bar once
 *  one or more rows are picked. The right edge always carries a refresh button. */
export default function MailListToolbar({
  folder,
  rows,
  selectedIds,
  onSelectAll,
  onBulkTrash,
  onBulkRestore,
  onBulkMarkSeen,
  onRefresh,
  refreshing,
}: MailListToolbarProps) {
  const count = selectedIds.size
  const total = rows.length
  const allSelected = total > 0 && count === total
  const checkboxState: boolean | "indeterminate" =
    allSelected ? true : count > 0 ? "indeterminate" : false
  const isTrash = folder === "trash"

  return (
    <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 sm:px-4">
      <Checkbox
        checked={checkboxState}
        onCheckedChange={onSelectAll}
        aria-label={allSelected ? "Deselect all messages" : "Select all messages"}
        className="shrink-0 data-[state=checked]:border-brand-navy data-[state=checked]:bg-brand-navy"
      />

      {count > 0 ? (
        <>
          <span className="text-sm font-medium text-foreground">
            {count} selected
          </span>
          <div className="flex items-center gap-1">
            {isTrash ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBulkRestore}
                className={cn("gap-1.5", FOCUS_RING)}
              >
                <RotateCcw className="size-4" />
                Restore
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBulkTrash}
                  className={cn("gap-1.5", FOCUS_RING)}
                >
                  <Trash2 className="size-4" />
                  Trash
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBulkMarkSeen}
                  className={cn("gap-1.5", FOCUS_RING)}
                >
                  <MailOpen className="size-4" />
                  Mark read
                </Button>
              </>
            )}
          </div>
        </>
      ) : (
        <span className="text-sm text-muted-foreground">
          {total} {total === 1 ? "message" : "messages"}
        </span>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh folder"
        className={cn("ml-auto gap-1.5", FOCUS_RING)}
      >
        <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </div>
  )
}
