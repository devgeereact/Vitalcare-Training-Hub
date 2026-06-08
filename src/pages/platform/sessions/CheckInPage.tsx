import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { CheckCircle2, XCircle, Loader2, Video, BadgeCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { selfCheckIn } from "@/lib/queries/sessions.queries"
import { getSessionJoinLink } from "@/lib/queries/virtual.queries"

type State =
  | { status: "loading" }
  | { status: "done"; already: boolean; link: string | null }
  | { status: "error"; message: string }

export default function CheckInPage() {
  const { id = "" } = useParams()
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { alreadyRegistered } = await selfCheckIn(id)
        // Only an approved learner (or staff) gets a link back; otherwise we tell
        // them to contact an admin.
        const join = await getSessionJoinLink(id).catch(() => null)
        const link = join?.meet_url || join?.zoom_join_url || null
        if (active) setState({ status: "done", already: alreadyRegistered, link })
      } catch (e) {
        if (active)
          setState({
            status: "error",
            message:
              e instanceof Error && e.message
                ? e.message
                : "You may not be signed in, or the session link is invalid.",
          })
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          {state.status === "loading" && (
            <>
              <Loader2 className="size-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Checking you in…</p>
            </>
          )}

          {state.status === "done" && (
            <>
              {state.already ? (
                <>
                  <BadgeCheck className="size-14 text-brand-gold" />
                  <h1 className="font-display text-2xl text-foreground">
                    You are already registered
                  </h1>
                  <p className="text-muted-foreground">
                    Your attendance for this session is already recorded.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-14 text-success" />
                  <h1 className="font-display text-2xl text-foreground">You're checked in</h1>
                  <p className="text-muted-foreground">Your attendance has been recorded.</p>
                </>
              )}

              {state.link ? (
                <Button asChild className="mt-2">
                  <a href={state.link} target="_blank" rel="noopener noreferrer">
                    <Video className="mr-2 size-4" /> Join the meeting
                  </a>
                </Button>
              ) : (
                <p className="mt-1 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                  If you are not redirected to the meeting, please contact your admin
                  to be added.
                </p>
              )}

              <Button asChild variant="outline" className="mt-1">
                <Link to="/platform/dashboard">Go to dashboard</Link>
              </Button>
            </>
          )}

          {state.status === "error" && (
            <>
              <XCircle className="size-14 text-destructive" />
              <h1 className="font-display text-2xl text-foreground">Check-in failed</h1>
              <p className="text-muted-foreground">{state.message}</p>
              <Button asChild variant="outline" className="mt-2">
                <Link to="/sign-in">Sign in</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
