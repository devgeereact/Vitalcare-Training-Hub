import { useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"
import { Mail, MessageSquare, Trash2, Loader2, ShieldAlert, GraduationCap, CalendarDays } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUser } from "@/hooks/use-user"
import { useUserMutations } from "@/lib/queries/users.queries"
import { useCourses } from "@/lib/queries/courses.queries"
import type { Profile, UserRole } from "@/types/database.types"

const ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "manager",
  "trainer",
  "content_editor",
  "learner",
  "guest",
]

function displayName(p: Profile): string {
  return (
    p.full_name ||
    [p.first_name, p.last_name].filter(Boolean).join(" ") ||
    p.email ||
    "User"
  )
}

export default function ContactDetailDialog({
  user,
  open,
  onOpenChange,
  manageable = false,
}: {
  user: Profile | null
  open: boolean
  onOpenChange: (v: boolean) => void
  /**
   * When true, surfaces role, course and removal controls (super-admins only).
   * Defaults to false so the dialog is a read-only contact card. Editing users
   * happens only on the All accounts page.
   */
  manageable?: boolean
}) {
  const { isSuperAdmin } = useUser()
  const { setRole, remove, assignCourse } = useUserMutations()
  const courses = useCourses()
  const [role, setLocalRole] = useState<UserRole | "">("")
  const [course, setCourse] = useState("")

  if (!user) return null
  const name = displayName(user)
  const currentRole = (role || user.role) as UserRole

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-navy/10 text-base font-semibold text-brand-navy">
              {name.slice(0, 1).toUpperCase()}
            </span>
            {name}
          </DialogTitle>
          <DialogDescription>
            <Badge variant="secondary" className="capitalize">
              {user.role.replace("_", " ")}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="truncate font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium">{user.phone || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Emergency contact</p>
              <p className="font-medium">{user.emergency_contact_name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Emergency phone</p>
              <p className="font-medium">{user.emergency_contact_phone || "-"}</p>
            </div>
            {user.created_at && (
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="flex items-center gap-1.5 font-medium">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  {format(new Date(user.created_at), "d MMM yyyy")}
                </p>
              </div>
            )}
          </div>
          {user.about && (
            <div>
              <p className="text-xs text-muted-foreground">About</p>
              <p className="whitespace-pre-wrap">{user.about}</p>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${user.email}`}>
                <Mail className="mr-1.5 size-4" /> Email
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/platform/messages?to=${user.id}&name=${encodeURIComponent(name)}`}>
                <MessageSquare className="mr-1.5 size-4" /> Message
              </Link>
            </Button>
          </div>

          {/* Management — All accounts only, super-admins */}
          {manageable && isSuperAdmin && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-brand-navy">
                <ShieldAlert className="size-3.5" /> User management
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <Label className="mb-1.5 block text-xs">Role</Label>
                  <Select value={currentRole} onValueChange={(v) => setLocalRole(v as UserRole)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="capitalize">
                          {r.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  disabled={currentRole === user.role || setRole.isPending}
                  onClick={() =>
                    setRole
                      .mutateAsync({ id: user.id, role: currentRole })
                      .then(() => toast.success("Role updated"))
                      .catch(() => toast.error("Could not update role"))
                  }
                >
                  {setRole.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                  Save role
                </Button>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[180px] flex-1">
                  <Label className="mb-1.5 block text-xs">Assign a course</Label>
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {(courses.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!course || assignCourse.isPending}
                  onClick={() =>
                    assignCourse
                      .mutateAsync({ learnerId: user.id, courseId: course })
                      .then((r) =>
                        toast.success(r.already ? "Already enrolled" : "Course assigned"),
                      )
                      .catch(() => toast.error("Could not assign"))
                  }
                >
                  <GraduationCap className="mr-1.5 size-4" /> Assign
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => {
                  if (!confirm(`Remove ${name}?`)) return
                  remove
                    .mutateAsync(user.id)
                    .then(() => {
                      toast.success("User removed")
                      onOpenChange(false)
                    })
                    .catch(() => toast.error("Could not remove"))
                }}
              >
                <Trash2 className="mr-1.5 size-4" /> Remove user
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
