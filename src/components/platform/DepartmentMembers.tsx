import { useState } from "react"
import { toast } from "sonner"
import { UserPlus, Trash2, Users } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useDepartmentMembers,
  useDepartmentMemberMutations,
  useStaff,
} from "@/lib/queries/org.queries"

interface Props {
  departmentId: string
  /** Only super_admin may assign or remove members. */
  canManage: boolean
}

export default function DepartmentMembers({ departmentId, canManage }: Props) {
  const members = useDepartmentMembers(departmentId)
  const mut = useDepartmentMemberMutations(departmentId)
  const staff = useStaff()
  const [add, setAdd] = useState("")

  const memberIds = new Set((members.data ?? []).map((m) => m.userId))
  const available = (staff.data ?? []).filter((s) => !memberIds.has(s.id))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>
          People assigned to this department collaboration space.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canManage && (
          <div className="flex gap-2">
            <Select value={add} onValueChange={setAdd}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Assign a person…" />
              </SelectTrigger>
              <SelectContent>
                {available.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No more people
                  </SelectItem>
                ) : (
                  available.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!add || mut.addMember.isPending}
              onClick={() =>
                mut.addMember
                  .mutateAsync(add)
                  .then(() => {
                    toast.success("Member assigned")
                    setAdd("")
                  })
                  .catch(() => toast.error("Could not assign member"))
              }
            >
              <UserPlus className="mr-1.5 size-4" /> Assign
            </Button>
          </div>
        )}

        {members.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : members.isError ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Could not load members. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => members.refetch()}>
              Retry
            </Button>
          </div>
        ) : (members.data?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Users className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No members yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {members.data!.map((m) => (
              <li key={m.memberId} className="flex items-center gap-3 py-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-navy/10 text-sm font-semibold text-brand-navy">
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {m.role.replace("_", " ")}
                </Badge>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      mut.removeMember
                        .mutateAsync(m.memberId)
                        .then(() => toast.success("Member removed"))
                        .catch(() => toast.error("Could not remove"))
                    }
                    aria-label={`Remove ${m.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
