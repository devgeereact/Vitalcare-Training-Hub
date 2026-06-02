import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Route, AlertCircle, Plus, Loader2, ChevronRight } from "lucide-react"

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
import { usePaths, useCreatePath } from "@/lib/queries/paths.queries"

export default function LearningPathsPage() {
  const { profile, isAdmin, isTrainer } = useUser()
  const canManage = isAdmin || isTrainer
  const { data, isLoading, isError, refetch } = usePaths()
  const create = useCreatePath()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")

  function submit() {
    if (!name.trim() || !profile?.id) return
    create
      .mutateAsync({ name, description: desc, createdBy: profile.id })
      .then(() => {
        toast.success("Path created")
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
          <h1 className="font-display text-3xl text-foreground">Learning paths</h1>
          <p className="mt-1 text-muted-foreground">
            Structured course sequences for each role or requirement.
          </p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> New path
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New learning path</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Path name (e.g. New Care Worker Induction)"
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
        )}
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
              Could not load paths. Please try again.
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
              <Route className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No learning paths yet.
              {canManage ? " Create your first one above." : ""}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((p) => (
            <Link key={p.id} to={`/platform/courses/paths/${p.id}`}>
              <Card className="h-full transition-colors hover:border-brand-navy/40">
                <CardContent className="flex items-start gap-3 p-5">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                    <Route className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    {p.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-2">
                      {p.courseCount} course{p.courseCount === 1 ? "" : "s"}
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
