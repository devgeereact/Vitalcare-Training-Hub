import { Fragment, type ReactElement } from "react"
import { format, isToday, isYesterday, isSameDay } from "date-fns"
import { Check, CheckCheck, FileText } from "lucide-react"

import { cn } from "@/lib/utils"

/** Minimal shape each rendered chat message needs. */
export interface ChatBubbleMessage {
  id: string
  sender_id: string
  body: string | null
  read_at: string | null
  created_at: string | null
  attachment_url: string | null
  attachment_name: string | null
  attachment_type: string | null
}

function isImage(type: string | null): boolean {
  return !!type && type.startsWith("image/")
}

/** Format a timestamp as HH:mm, returning "" for missing/invalid values. */
function timeLabel(value: string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "" : format(d, "HH:mm")
}

/** Parse a timestamp into a Date, or null when missing/invalid. */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** WhatsApp-style day label: "Today", "Yesterday", else "EEEE, d MMM yyyy". */
function dayLabel(d: Date): string {
  if (isToday(d)) return "Today"
  if (isYesterday(d)) return "Yesterday"
  return format(d, "EEEE, d MMM yyyy")
}

/** Centred date chip shown between messages that cross a calendar day. */
export function DaySeparator({ label }: { label: string }): ReactElement {
  return (
    <div className="my-3 flex justify-center">
      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
        {label}
      </span>
    </div>
  )
}

function MessageBubble({
  message,
  mine,
  otherInitial,
  showAvatar,
  isRunEnd,
}: {
  message: ChatBubbleMessage
  mine: boolean
  otherInitial: string
  showAvatar: boolean
  isRunEnd: boolean
}): ReactElement {
  return (
    <div className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
      {!mine &&
        (showAvatar ? (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-navy/10 text-[11px] font-semibold text-brand-navy">
            {otherInitial}
          </span>
        ) : (
          <span aria-hidden className="size-7 shrink-0" />
        ))}
      <div
        className={cn(
          "max-w-[80%] min-w-0 overflow-hidden px-3.5 py-2 text-sm shadow-sm sm:max-w-[75%]",
          mine
            ? "bg-brand-navy text-white"
            : "border border-border bg-muted text-foreground",
          // WhatsApp-style: flatten the tail-side corner only on the last of a run.
          mine
            ? isRunEnd
              ? "rounded-2xl rounded-br-sm"
              : "rounded-2xl"
            : isRunEnd
              ? "rounded-2xl rounded-bl-sm"
              : "rounded-2xl",
        )}
      >
        {message.attachment_url && (
          <div className="mb-1.5">
            {isImage(message.attachment_type) ? (
              <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={message.attachment_url}
                  alt={message.attachment_name ?? "attachment"}
                  className="max-h-48 max-w-full rounded-lg object-cover"
                  loading="lazy"
                />
              </a>
            ) : (
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-xs underline-offset-2 hover:underline",
                  mine ? "bg-white/15" : "bg-background",
                )}
              >
                <FileText className="size-4 shrink-0" />
                <span className="min-w-0 truncate">
                  {message.attachment_name ?? "Attachment"}
                </span>
              </a>
            )}
          </div>
        )}
        {message.body && (
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {message.body}
          </p>
        )}
        <p
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px] leading-none",
            mine ? "text-white/60" : "text-muted-foreground",
          )}
        >
          {timeLabel(message.created_at)}
          {mine &&
            (message.read_at ? (
              <CheckCheck className="size-3.5 text-sky-300" />
            ) : (
              <Check className="size-3.5" />
            ))}
        </p>
      </div>
    </div>
  )
}

/**
 * Renders a chat transcript WhatsApp-style: day separators between calendar
 * days, grouped runs of same-sender messages (tighter spacing, avatar and
 * read state only on the last of a run), and own/incoming bubble alignment.
 */
export function ChatMessageList({
  messages,
  userId,
  otherName,
}: {
  messages: ChatBubbleMessage[]
  userId: string
  otherName: string
}): ReactElement {
  const otherInitial = otherName.slice(0, 1).toUpperCase()

  return (
    <>
      {messages.map((m, i) => {
        const mine = m.sender_id === userId
        const prev = i > 0 ? messages[i - 1] : null
        const next = i < messages.length - 1 ? messages[i + 1] : null

        const thisDate = toDate(m.created_at)
        const prevDate = toDate(prev?.created_at)
        const showDay =
          thisDate !== null && (prevDate === null || !isSameDay(thisDate, prevDate))

        // A "run" is consecutive messages from the same sender on the same day.
        const nextDate = toDate(next?.created_at)
        const sameRunAsNext =
          next !== null &&
          next.sender_id === m.sender_id &&
          thisDate !== null &&
          nextDate !== null &&
          isSameDay(thisDate, nextDate)
        const isRunEnd = !sameRunAsNext

        const sameRunAsPrev =
          prev !== null &&
          prev.sender_id === m.sender_id &&
          thisDate !== null &&
          prevDate !== null &&
          isSameDay(thisDate, prevDate) &&
          !showDay

        return (
          <Fragment key={m.id}>
            {showDay && thisDate && <DaySeparator label={dayLabel(thisDate)} />}
            <div className={cn(sameRunAsPrev ? "mt-0.5" : "mt-2")}>
              <MessageBubble
                message={m}
                mine={mine}
                otherInitial={otherInitial}
                showAvatar={isRunEnd}
                isRunEnd={isRunEnd}
              />
            </div>
          </Fragment>
        )
      })}
    </>
  )
}
