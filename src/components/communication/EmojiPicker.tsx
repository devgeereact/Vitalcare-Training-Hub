import { Smile } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

const EMOJIS = [
  "😀", "😁", "😄", "😊", "🙂", "😉", "😍", "😎", "🤔", "🙌",
  "👍", "👏", "🙏", "💪", "✅", "✨", "🎉", "🔥", "💡", "📌",
  "📅", "📎", "📝", "❤️", "👀", "😅", "😂", "🤝", "👋", "⭐",
]

interface Props {
  /** Called with the chosen emoji character. */
  onSelect: (emoji: string) => void
}

/** Lightweight emoji picker for the chat composer. No external dependency. */
export default function EmojiPicker({ onSelect }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Insert emoji"
          className="shrink-0 text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          <Smile className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="grid grid-cols-6 gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onSelect(e)}
              className="rounded-md p-1.5 text-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
              aria-label={`Insert ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
