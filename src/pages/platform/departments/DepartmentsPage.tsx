import { useState } from "react"
import { toast } from "sonner"
import { Building2, AlertCircle, Plus, Loader2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useDepartments, useCreateDepartment } from "@/lib/queries/org.queries"

export default function DepartmentsPage() {
  const { profile } = useUser()
  const { data, isLoading, isError, refetch } = useDepartments()
  const create = useCreateDepartment()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  function submit() {
    if (!name.trim() || !profile?.organisation_id) {
      if (!profile?.organisation_id)
        toast.error("Your account is not linked to an organisation yet.")
      return
    }
    create
      .mutateAsync({ name, organisationId: profile.organisation_id })
      .then(() => {
        toast.success("Department added")
        setName("")
        setOpen(false)
      })
      .catch(() => toast.error("Could not add department. Please try again."))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Departments</h1>
          <p className="mt-1 text-muted-foreground">
            Organise learners and staff into teams within your organisation.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" /> Add department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add department</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Department name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!name.trim() || create.isPending}>
                {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load departments. Please try again.
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
              <Building2 className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No departments yet. Add your first one above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                  <Building2 className="size-5" />
                </span>
                <p className="font-medium">{d.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
