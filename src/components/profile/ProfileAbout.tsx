import { UserRound } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import ProfileCardHeader from "@/components/profile/ProfileCardHeader"

interface Props {
  /** The user's saved bio. Never altered or generated. */
  about: string | null | undefined
}

/** Read-only About card. Shows the saved bio or a prompt to add one. */
export default function ProfileAbout({ about }: Props): React.ReactElement {
  const hasBio = !!about?.trim()
  return (
    <Card>
      <ProfileCardHeader
        icon={UserRound}
        title="About"
        description="A short bio for colleagues."
      />
      <CardContent>
        {hasBio ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {about}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add a short bio in Settings so colleagues know who you are.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
