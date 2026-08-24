import { useState } from "react"
import { saveAs } from "file-saver"
import { Users, AlertCircle, Search, UserPlus, Download } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAllUsers } from "@/lib/queries/users.queries"
import { useAuth } from "@/hooks/use-auth"
import NewAccountDialog from "@/components/people/NewAccountDialog"
import ContactDetailDialog from "@/components/platform/ContactDetailDialog"
import type { Profile, UserRole } from "@/types/database.types"

const ROLE_FILTERS: (UserRole | "all")[] = [
  "all",
  "learner",
  "trainer",
  "manager",
  "admin",
  "super_admin",
  "content_editor",
]

function name(p: Profile) {
  return (
    p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email
  )
}

/** Load the 1.2MB spreadsheet library only when an export runs. */
async function loadXlsx() {
  return await import("xlsx")
}

async function exportUsers(users: Profile[]): Promise<void> {
  const XLSX = await loadXlsx()
  const rows = users.map((u) => ({
    Name: name(u),
    Email: u.email,
    Role: u.role.replace("_", " "),
    Phone: u.phone ?? "",
    Joined: u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB") : "",
  }))
  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: ["Name", "Email", "Role", "Phone", "Joined"],
  })
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, "Users")
  const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" })
  saveAs(
    new Blob([buffer], { type: "application/octet-stream" }),
    `vitalcare-users-${users.length}.xlsx`,
  )
}

export default function UserManagementPage() {
  const { data, isLoading, isError, refetch } = useAllUsers()
  const { role: currentRole } = useAuth()
  const isAdmin = currentRole === "admin" || currentRole === "super_admin"
  const [q, setQ] = useState("")
  const [role, setRole] = useState<UserRole | "all">("all")
  const [selected, setSelected] = useState<Profile | null>(null)

  const users = data ?? []
  const filtered = users.filter((u) => {
    const matchesRole = role === "all" || u.role === role
    const hay = `${name(u)} ${u.email}`.toLowerCase()
    return matchesRole && hay.includes(q.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">User management</h1>
          <p className="mt-1 text-muted-foreground">
            Everyone on the platform. Click a person to manage their role, assign
            courses or get in touch.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void exportUsers(users)}
            disabled={users.length === 0}
          >
            <Download className="mr-2 size-4" /> Export
          </Button>
          {isAdmin && (
            <NewAccountDialog>
              <Button>
                <UserPlus className="mr-2 size-4" /> New account
              </Button>
            </NewAccountDialog>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTERS.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">
                {r === "all" ? "All roles" : r.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load users.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Users className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">No users match.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelected(u)}
              className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-xl"
            >
              <Card className="h-full transition-colors hover:border-brand-navy/40">
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex size-11 items-center justify-center rounded-full bg-brand-navy/10 text-base font-semibold text-brand-navy">
                    {name(u).slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{name(u)}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {u.role.replace("_", " ")}
                  </Badge>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <ContactDetailDialog
        user={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        manageable
      />
    </div>
  )
}
