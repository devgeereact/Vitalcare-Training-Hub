import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  /** datetime-local string ("yyyy-MM-ddTHH:mm") or "" when unset. */
  value: string
  onChange: (value: string) => void
  id?: string
  className?: string
  placeholder?: string
  /** Default time used when a date is picked before a time. Defaults to 09:00. */
  defaultTime?: string
}

function parse(value: string): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function toValue(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

/**
 * Controlled date + time picker. A single trigger opens a calendar with a time
 * field beneath it. Emits a datetime-local string ("yyyy-MM-ddTHH:mm"), so it
 * drops in wherever an `<input type="datetime-local">` was used.
 */
export function DateTimePicker({
  value,
  onChange,
  id,
  className,
  placeholder = "Pick date and time",
  defaultTime = "09:00",
}: DateTimePickerProps): React.JSX.Element {
  const date = parse(value)
  const timeStr = date ? format(date, "HH:mm") : defaultTime

  function applyTime(base: Date, t: string): void {
    const [h, m] = t.split(":").map((n) => Number(n))
    const next = new Date(base)
    next.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0)
    onChange(toValue(next))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          className={cn(
            "w-full justify-start px-3 font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" />
          {date ? (
            format(date, "EEE d MMM yyyy, HH:mm")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(d) => {
            if (!d) {
              onChange("")
              return
            }
            applyTime(d, timeStr)
          }}
        />
        <div className="flex items-center gap-2 border-t border-border p-3">
          <span className="text-xs font-medium text-muted-foreground">Time</span>
          <Input
            type="time"
            value={timeStr}
            onChange={(e) => applyTime(date ?? new Date(), e.target.value)}
            className="w-32"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
