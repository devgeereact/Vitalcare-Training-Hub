import {
  Building2,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SOCIAL_PLATFORMS,
  type SocialLinks,
  type SocialPlatform,
} from "@/lib/queries/profile.queries"

const SOCIAL_META: Record<SocialPlatform, { label: string; icon: LucideIcon }> = {
  linkedin: { label: "LinkedIn", icon: Linkedin },
  twitter: { label: "X (Twitter)", icon: Twitter },
  facebook: { label: "Facebook", icon: Building2 },
  instagram: { label: "Instagram", icon: Instagram },
  youtube: { label: "YouTube", icon: Youtube },
  github: { label: "GitHub", icon: Github },
  website: { label: "Website", icon: Globe },
}

/** Prefix bare handles/links with https:// so the anchor resolves off-site. */
function href(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

interface Props {
  socialLinks: SocialLinks
}

/**
 * Social links only. Contact details (email, phone, organisation) live in the
 * Contact card, so this card just lists the saved social profiles, and renders
 * nothing when none are set.
 */
export default function ProfileConnections({
  socialLinks,
}: Props): React.JSX.Element | null {
  const socials = SOCIAL_PLATFORMS.filter((p) => socialLinks[p])
  if (socials.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Connections</CardTitle>
        <CardDescription>Find this person elsewhere.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {socials.map((p) => {
          const Icon = SOCIAL_META[p].icon
          return (
            <a
              key={p}
              href={href(socialLinks[p]!)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 truncate text-sm text-foreground">
                {SOCIAL_META[p].label}
              </span>
            </a>
          )
        })}
      </CardContent>
    </Card>
  )
}
