import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  AlertCircle,
  UserPlus,
  Trash2,
  GraduationCap,
  Loader2,
  Users,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCohort,
  useCohortMembers,
  useCohortMemberMutations,
  useBulkEnrol,
} from "@/lib/queries/cohorts.queries"
import { useLearners } from "@/lib/queries/learners.queries"
import { useCourses } from "@/lib/queries/courses.queries"

export default function CohortDetailPage() {
  const { id = "" } = useParams()
  const cohort = useCohort(id)
  const members = useCohortMembers(id)
  const mut = useCohortMemberMutations(id)
  const bulkEnrol = useBulkEnrol(id)
  const learners = useLearners()
  const courses = useCourses()

  const [addLearner, setAddLearner] = useState("")
  const [enrolCourse, setEnrolCourse] = useState("")

  const memberIds = new Set((members.data ?? []).map((m) => m.learnerId))
  const available = (learners.data ?? []).filter((l) => !memberIds.has(l.id))

  if (cohort.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }
  if (cohort.isError || !cohort.data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Could not load this cohort.</p>
        <Button variant="outline" size="sm" onClick={() => cohort.refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/platform/cohorts">
          <ArrowLeft className="mr-1.5 size-4" /> Back to cohorts
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">{cohort.data.name}</CardTitle>
          {cohort.data.description && (
            <CardDescription>{cohort.data.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Bulk enrol */}
      <Card>
        <CardHeader>
          <CardTitle>Enrol the whole cohort</CardTitle>
          <CardDescription>
            Enrol every member on a course. Anyone already enrolled is skipped.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Select value={enrolCourse} onValueChange={setEnrolCourse}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Choose a course…" />
            </SelectTrigger>
            <SelectContent>
              {(courses.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!enrolCourse || bulkEnrol.isPending || (members.data?.length ?? 0) === 0}
            onClick={() =>
              bulkEnrol
                .mutateAsync(enrolCourse)
                .then((r) =>
                  toast.success(
                    `Enrolled ${r.enrolled}${r.skipped ? `, skipped ${r.skipped} already enrolled` : ""}`,
                  ),
                )
                .catch(() => toast.error("Could not enrol the cohort."))
            }
          >
            {bulkEnrol.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <GraduationCap className="mr-2 size-4" />
            )}
            Enrol cohort
          </Button>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={addLearner} onValueChange={setAddLearner}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Add a learner…" />
              </SelectTrigger>
              <SelectContent>
                {available.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No more learners
                  </SelectItem>
                ) : (
                  available.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!addLearner || mut.addMember.isPending}
              onClick={() =>
                mut.addMember
                  .mutateAsync(addLearner)
                  .then(() => {
                    toast.success("Member added")
                    setAddLearner("")
                  })
                  .catch(() => toast.error("Could not add member"))
              }
            >
              <UserPlus className="mr-1.5 size-4" /> Add
            </Button>
          </div>

          {members.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
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
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
