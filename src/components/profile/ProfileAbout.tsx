import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Props {
  /** The user's saved bio. Never altered or generated. */
  about: string | null | undefined
}

/** Read-only About card. Shows the saved bio or a prompt to add one. */
export default function ProfileAbout({ about }: Props): React.ReactElement {
  const hasBio = !!about?.trim()
  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
        <CardDescription>A short bio for colleagues.</CardDescription>
      </CardHeader>
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
