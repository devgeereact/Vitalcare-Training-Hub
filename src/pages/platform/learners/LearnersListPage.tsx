import { useState } from "react"
import { Link } from "react-router-dom"
import { UserPlus, Upload, Users, AlertCircle, Search, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useLearners } from "@/lib/queries/learners.queries"
import ContactDetailById from "@/components/platform/ContactDetailById"
import ImportLearnersDialog from "./ImportLearnersDialog"

export default function LearnersListPage() {
  const { data, isLoading, isError, refetch } = useLearners()
  const [q, setQ] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = (data ?? []).filter(
    (l) =>
      l.name.toLowerCase().includes(q.toLowerCase()) ||
      l.email.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Learners</h1>
          <p className="mt-1 text-muted-foreground">
            Manage everyone enrolled on your training programmes.
          </p>
        </div>
        <div className="flex gap-2">
          <ImportLearnersDialog>
            <Button variant="outline">
              <Upload className="mr-2 size-4" /> Import
            </Button>
          </ImportLearnersDialog>
          <Button asChild>
            <Link to="/platform/learners/new">
              <UserPlus className="mr-2 size-4" /> Add learner
            </Link>
          </Button>
        </div>
      </div>

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search learners…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load learners. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Users className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No learners yet. Add your first learner or import a list.
            </p>
            <Button asChild size="sm">
              <Link to="/platform/learners/new">Add learner</Link>
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No learners match “{q}”.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setSelectedId(l.id)}
              className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              <Card className="h-full transition-colors hover:border-brand-navy/40">
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex size-11 items-center justify-center rounded-full bg-brand-navy/10 text-base font-semibold text-brand-navy">
                    {l.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Mail className="size-3" /> {l.email}
                    </p>
                    {l.phone && (
                      <p className="truncate text-xs text-muted-foreground">{l.phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <ContactDetailById userId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
