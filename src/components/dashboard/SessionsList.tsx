import type { JSX } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { Video, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface SessionListItem {
  id: string
  title: string
  startsAt: string
  isVirtual: boolean
  joinUrl?: string | null
  venue?: string
}

interface Props {
  items: SessionListItem[]
  /** Show a Join button for virtual sessions with a link. */
  showJoin?: boolean
}

/** Upcoming sessions list, shared across roles. Parent owns states. */
export function SessionsList({ items, showJoin = false }: Props): JSX.Element {
  return (
    <ul className="-my-1 divide-y divide-border">
      {items.map((s) => (
        <li
          key={s.id}
          className="flex items-center gap-3 rounded-lg px-1 py-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {s.isVirtual ? (
              <Video className="size-4" aria-hidden="true" />
            ) : (
              <MapPin className="size-4" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {s.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(s.startsAt), "EEE d MMM, HH:mm")} ·{" "}
              {formatDistanceToNow(new Date(s.startsAt), { addSuffix: true })}
            </p>
          </div>
          {showJoin && s.isVirtual && s.joinUrl ? (
            <Button
              asChild
              size="sm"
              className="shrink-0 bg-brand-navy hover:bg-brand-navy-dark"
            >
              <a href={s.joinUrl} target="_blank" rel="noopener noreferrer">
                Join
              </a>
            </Button>
          ) : (
            <Badge variant="outline" className="shrink-0">
              {s.isVirtual ? "Virtual" : "In person"}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  )
}
