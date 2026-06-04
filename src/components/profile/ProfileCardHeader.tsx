import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  /** Lucide icon component shown in the navy chip beside the title. */
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
}

/**
 * Shared icon-led header for profile cards. Keeps every card title aligned to
 * the same baseline (navy icon chip + DM Serif title), so the column reads as
 * one consistent set rather than mismatched panels.
 */
export default function ProfileCardHeader({
  icon: Icon,
  title,
  description,
}: Props): React.ReactElement {
  return (
    <CardHeader>
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-navy/5 text-brand-navy">
          <Icon className="size-4" />
        </span>
        <div className="space-y-1">
          <CardTitle className="font-display text-lg leading-none text-foreground">
            {title}
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
      </div>
    </CardHeader>
  )
}
