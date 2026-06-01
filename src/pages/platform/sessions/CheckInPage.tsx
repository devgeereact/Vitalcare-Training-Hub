import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { selfCheckIn } from "@/lib/queries/sessions.queries"

export default function CheckInPage() {
  const { id = "" } = useParams()
  const [state, setState] = useState<"loading" | "done" | "error">("loading")

  useEffect(() => {
    let active = true
    selfCheckIn(id)
      .then(() => active && setState("done"))
      .catch(() => active && setState("error"))
    return () => {
      active = false
    }
  }, [id])

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          {state === "loading" && (
            <>
              <Loader2 className="size-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Checking you in…</p>
            </>
          )}
          {state === "done" && (
            <>
              <CheckCircle2 className="size-14 text-success" />
              <h1 className="font-display text-2xl text-foreground">You're checked in</h1>
              <p className="text-muted-foreground">Your attendance has been recorded.</p>
              <Button asChild className="mt-2">
                <Link to="/platform/dashboard">Go to dashboard</Link>
              </Button>
            </>
          )}
          {state === "error" && (
            <>
              <XCircle className="size-14 text-destructive" />
              <h1 className="font-display text-2xl text-foreground">Check-in failed</h1>
              <p className="text-muted-foreground">
                You may not be signed in, or the session link is invalid.
              </p>
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
