import { useState } from "react"
import { toast } from "sonner"
import {
  Building2,
  AlertCircle,
  Plus,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Pencil,
  Search,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import AiFieldsButton from "@/components/ai/AiFieldsButton"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import DepartmentMembers from "@/components/platform/DepartmentMembers"
import DepartmentBoard from "@/components/platform/DepartmentBoard"
import CompanyClosures from "@/components/organisation/CompanyClosures"
import { useUser } from "@/hooks/use-user"
import {
  useDepartments,
  useCreateDepartment,
  useDeleteDepartment,
  type DepartmentRow,
} from "@/lib/queries/org.queries"

export default function DepartmentsPage() {
  const { profile, isSuperAdmin } = useUser()
  const { data, isLoading, isError, refetch } = useDepartments()
  const create = useCreateDepartment()
  const del = useDeleteDepartment()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [active, setActive] = useState<DepartmentRow | null>(null)
  const [search, setSearch] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  function submit() {
    if (!name.trim() || !profile?.organisation_id) {
      if (!profile?.organisation_id)
        toast.error("Your account is not linked to an organisation yet.")
      return
    }
    create
      .mutateAsync({ name, organisationId: profile.organisation_id, description })
      .then(() => {
        toast.success("Department added")
        setName("")
        setDescription("")
        setOpen(false)
      })
      .catch(() => toast.error("Could not add department. Please try again."))
  }

  function handleDelete(dept: DepartmentRow) {
    if (!confirm(`Delete the department "${dept.name}"? Tasks are removed too.`))
      return
    del
      .mutateAsync(dept.id)
      .then(() => {
        toast.success("Department deleted")
        if (active?.id === dept.id) setActive(null)
      })
      .catch(() => toast.error("Could not delete. Please try again."))
  }

  /* ------------------------------------------------ detail (one dept) ----- */
  if (active) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => setActive(null)}
        >
          <ChevronLeft className="mr-1.5 size-4" /> Back to departments
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">{active.name}</CardTitle>
            {active.description && (
              <CardDescription>{active.description}</CardDescription>
            )}
          </CardHeader>
        </Card>

        <DepartmentMembers departmentId={active.id} canManage={isSuperAdmin} />
        <DepartmentBoard departmentId={active.id} createdBy={profile?.id ?? null} />
      </div>
    )
  }

  /* ------------------------------------------------------ list view ------- */
  const allRows = data ?? []
  const filtered = allRows.filter((d) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      d.name.toLowerCase().includes(q) ||
      (d.description ?? "").toLowerCase().includes(q)
    )
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const firstShown = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const lastShown = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="space-y-6">
      <Dialog open={open} onOpenChange={setOpen}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border">
            <CardTitle className="font-display text-2xl">Department list</CardTitle>
            {isSuperAdmin && (
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-1.5 size-4" /> Add new
                </Button>
              </DialogTrigger>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <AlertCircle className="size-8 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  Could not load departments. Please try again.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : allRows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Building2 className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {isSuperAdmin
                    ? "No departments yet. Add your first one above."
                    : "No departments yet."}
                </p>
              </div>
            ) : (
              <>
                {/* Toolbar: page size + search */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    Show
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setPage(1)
                      }}
                      className="rounded-md border border-border bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843]"
                    >
                      {[10, 25, 50].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    entries
                  </label>
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">S.No</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Members</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((d, i) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-muted-foreground">
                          {String(firstShown + i).padStart(2, "0")}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setActive(d)}
                            className="flex items-center gap-2 text-left font-medium text-foreground hover:text-brand-navy focus-visible:outline-none focus-visible:underline"
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                              <Building2 className="size-4" />
                            </span>
                            {d.name}
                          </button>
                        </TableCell>
                        <TableCell className="max-w-sm truncate text-sm text-muted-foreground">
                          {d.description || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{d.memberCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="icon"
                              className="size-8 bg-brand-navy text-white hover:bg-brand-navy-dark"
                              onClick={() => setActive(d)}
                              aria-label={`Open ${d.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            {isSuperAdmin && (
                              <Button
                                size="icon"
                                variant="destructive"
                                className="size-8"
                                disabled={del.isPending}
                                onClick={() => handleDelete(d)}
                                aria-label={`Delete ${d.name}`}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {firstShown} to {lastShown} of {filtered.length} entries
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-4" /> Previous
                    </Button>
                    {Array.from({ length: pageCount }).map((_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={safePage === i + 1 ? "default" : "outline"}
                        className="size-9 p-0"
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    >
                      Next <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add department</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Department name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="Details (optional)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-end">
              <AiFieldsButton
                subject="a department in a healthcare training organisation"
                context={name ? `Working name: ${name}` : undefined}
                fields={[
                  { key: "name", label: "Name", format: "text" },
                  { key: "description", label: "Description", format: "text" },
                ]}
                onApply={(v) => {
                  if (v.name) setName(v.name.slice(0, 80))
                  if (v.description) setDescription(v.description)
                }}
              />
            </div>
          </div>
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

      <CompanyClosures />
    </div>
  )
}
