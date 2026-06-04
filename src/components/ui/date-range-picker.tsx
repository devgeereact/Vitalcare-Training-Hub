import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  /** Number of months shown in the popover calendar. Defaults to 2. */
  numberOfMonths?: number
  id?: string
}

/**
 * Reusable controlled date-range picker. A single trigger button shows the
 * selected range and opens a two-month calendar. Use anywhere a from/to date
 * range is needed (reports, payroll periods, exports).
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
  numberOfMonths = 2,
  id,
}: DateRangePickerProps): React.JSX.Element {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          className={cn(
            "justify-start px-3 font-normal",
            !value?.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "LLL dd, y")} - {format(value.to, "LLL dd, y")}
              </>
            ) : (
              format(value.from, "LLL dd, y")
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={numberOfMonths}
        />
      </PopoverContent>
    </Popover>
  )
}
