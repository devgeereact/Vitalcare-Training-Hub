import type { JSX } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { Megaphone } from "lucide-react"

export interface NoticeItem {
  id: string
  title: string
  body: string
  authorName: string
  createdAt: string
}

interface Props {
  items: NoticeItem[]
}

/** Latest announcements, newest first. Parent owns loading/empty/error. */
export function NoticeBoard({ items }: Props): JSX.Element {
  return (
    <ul className="divide-y divide-border">
      {items.map((n) => (
        <li key={n.id} className="flex gap-3 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-navy">
            <Megaphone className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to="/platform/announcements"
              className="block truncate text-sm font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
            >
              {n.title}
            </Link>
            <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {n.authorName} ·{" "}
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
