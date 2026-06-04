import {
  Building2,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Phone,
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
import type { Profile } from "@/types/database.types"
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
  profile: Profile
  organisationName: string | null
  socialLinks: SocialLinks
}

/**
 * Connections card: real ways to reach this person. Direct contacts (email,
 * phone, organisation, message) plus any social links they have saved in
 * Settings. Renders only what exists, so it never shows empty placeholders.
 */
export default function ProfileConnections({
  profile,
  organisationName,
  socialLinks,
}: Props): React.JSX.Element {
  const socials = SOCIAL_PLATFORMS.filter((p) => socialLinks[p])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Connections</CardTitle>
        <CardDescription>Ways to reach this person.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {profile.email && (
          <Row
            icon={Mail}
            label={profile.email}
            href={`mailto:${profile.email}`}
          />
        )}
        {profile.phone && (
          <Row icon={Phone} label={profile.phone} href={`tel:${profile.phone}`} />
        )}
        {organisationName && (
          <Row icon={Building2} label={organisationName} />
        )}

        {socials.length > 0 && (
          <div className="mt-2 border-t border-border pt-2">
            {socials.map((p) => (
              <Row
                key={p}
                icon={SOCIAL_META[p].icon}
                label={SOCIAL_META[p].label}
                href={href(socialLinks[p]!)}
                external
              />
            ))}
          </div>
        )}

        {!profile.email && !profile.phone && !organisationName && socials.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            No contact details yet. Add links in Settings.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Row({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: LucideIcon
  label: string
  href?: string
  external?: boolean
}): React.JSX.Element {
  const inner = (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 truncate text-sm text-foreground">{label}</span>
    </>
  )
  const cls =
    "flex items-center gap-3 rounded-lg px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
  if (!href) {
    return <div className={cls}>{inner}</div>
  }
  return (
    <a
      href={href}
      className={`${cls} hover:bg-muted`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {inner}
    </a>
  )
}
