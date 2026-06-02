import { useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen, AlertCircle, Search, Clock, Shield } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useLibrary } from "@/lib/queries/library.queries"

export default function LibraryPage() {
  const { data, isLoading, isError, refetch } = useLibrary()
  const [q, setQ] = useState("")
  const filtered = (data ?? []).filter(
    (r) =>
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      r.categoryName.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Resource library</h1>
        <p className="mt-1 text-muted-foreground">
          Browse every published course and its CPD value.
        </p>
      </div>

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load the library. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <BookOpen className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No published resources yet. Publish a course to add it here.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No resources match “{q}”.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.id} className="flex flex-col overflow-hidden">
              {r.thumbnailUrl && (
                <img
                  src={r.thumbnailUrl}
                  alt={r.title}
                  className="aspect-video w-full object-cover"
                />
              )}
              <CardHeader className="pb-2">
                <Badge variant="secondary" className="w-fit font-normal">
                  {r.categoryName}
                </Badge>
                <CardTitle className="text-base leading-snug">
                  <Link to={`/platform/courses/${r.id}`} className="hover:text-brand-navy">
                    {r.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                {r.summary && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {r.summary}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" /> {r.durationMins} min
                  </span>
                  {r.cpdHours > 0 && <span>{r.cpdHours} CPD hours</span>}
                  {r.isCstfAligned && (
                    <span className="flex items-center gap-1 text-success">
                      <Shield className="size-3.5" /> CSTF
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
