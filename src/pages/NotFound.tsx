import { Link, useLocation } from "react-router-dom"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { PageMeta } from "@/components/seo/PageMeta"

/**
 * The public 404.
 *
 * Where it sends people depends on who they are. Offering "Go to Dashboard" to
 * a visitor with no account is a dead end: they land on a sign-in wall from a
 * page that was already a dead end. Signed-out visitors get the routes that
 * exist for them; the dashboard appears only once there is a session to open it
 * with.
 */
export default function NotFound() {
  const { session, loading } = useAuth()
  const { pathname } = useLocation()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <PageMeta
        title="Page not found"
        description="The page you were looking for is not here."
        noIndex
      />
      <Compass className="size-10 text-brand-gold" aria-hidden="true" />
      <p className="mt-4 font-display text-6xl text-foreground">404</p>
      <h1 className="mt-3 font-display text-2xl text-foreground">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Nothing lives at <code className="font-mono text-xs">{pathname}</code>.
        It may have moved, or the link may be out of date.
      </p>

      <nav aria-label="Where to next" className="mt-8">
        <ul className="flex flex-wrap justify-center gap-2">
          {loading ? null : session ? (
            <>
              <li>
                <Button asChild>
                  <Link to="/platform/dashboard">Go to your dashboard</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="outline">
                  <Link to="/platform/courses">Your courses</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="outline">
                  <Link to="/">Main site</Link>
                </Button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Button asChild>
                  <Link to="/">Home</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="outline">
                  <Link to="/our-courses">Browse courses</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="outline">
                  <Link to="/contact-us">Contact us</Link>
                </Button>
              </li>
              <li>
                <Button asChild variant="ghost">
                  <Link to="/sign-in">Sign in</Link>
                </Button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </main>
  )
}
