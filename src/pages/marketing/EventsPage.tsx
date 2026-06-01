import { useQuery } from "@tanstack/react-query"
import { CalendarDays, MapPin, Loader2 } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { supabase } from "@/lib/supabase/client"
import type { TrainingSession } from "@/types/database.types"

async function getPublicSessions(): Promise<TrainingSession[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("is_public", true)
    .is("deleted_at", null)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
  if (error) {
    console.error("[getPublicSessions]", error)
    throw error
  }
  return data ?? []
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function EventsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-sessions"],
    queryFn: getPublicSessions,
  })

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Upcoming training sessions"
        description="Live and virtual sessions open for booking. New dates are added regularly."
      />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading sessions
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="font-semibold text-destructive">
              Could not load sessions
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-md bg-brand-navy px-5 py-2 text-sm font-semibold text-white hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <CalendarDays className="mx-auto size-10 text-brand-navy/40" />
            <h2 className="mt-4 font-display text-2xl text-brand-navy">
              No public sessions scheduled
            </h2>
            <p className="mt-2 text-muted-foreground">
              There are no open sessions right now. Contact us to arrange
              training for your team.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {data.map((session) => (
              <li
                key={session.id}
                className="rounded-xl border border-border p-6"
              >
                <h3 className="font-semibold text-brand-navy">{session.title}</h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4" />
                    {formatWhen(session.starts_at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {session.is_virtual ? "Online" : (session.venue ?? "In person")}
                  </span>
                </div>
                {session.description ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {session.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
