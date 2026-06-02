import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { UsersRound, AlertCircle, Plus, Loader2, ChevronRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useUser } from "@/hooks/use-user"
import { useCohorts, useCreateCohort } from "@/lib/queries/cohorts.queries"

export default function CohortsPage() {
  const { profile } = useUser()
  const { data, isLoading, isError, refetch } = useCohorts()
  const create = useCreateCohort()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")

  function submit() {
    if (!name.trim() || !profile?.id) return
    create
      .mutateAsync({
        name,
        description: desc,
        organisationId: profile.organisation_id ?? null,
        createdBy: profile.id,
      })
      .then(() => {
        toast.success("Cohort created")
        setName("")
        setDesc("")
        setOpen(false)
      })
      .catch(() => toast.error("Could not create. Please try again."))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Cohorts &amp; teams</h1>
          <p className="mt-1 text-muted-foreground">
            Group learners for shared enrolment and reporting.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" /> New cohort
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New cohort</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Cohort name (e.g. January intake)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Textarea
                placeholder="Description (optional)"
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!name.trim() || create.isPending}>
                {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load cohorts. Please try again.
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
              <UsersRound className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No cohorts yet. Create your first one above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((c) => (
            <Link key={c.id} to={`/platform/cohorts/${c.id}`}>
              <Card className="h-full transition-colors hover:border-brand-navy/40">
                <CardContent className="flex items-start gap-3 p-5">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                    <UsersRound className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    {c.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-2">
                      {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
