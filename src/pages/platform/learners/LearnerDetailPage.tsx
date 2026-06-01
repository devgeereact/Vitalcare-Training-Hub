import { useParams, Link } from "react-router-dom"
import { format } from "date-fns"
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  CalendarDays,
  AlertCircle,
  BookOpen,
  Award,
} from "lucide-react"

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
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  useLearner,
  useLearnerEnrolments,
  useLearnerCertificates,
} from "@/lib/queries/learners.queries"

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  )
}

export default function LearnerDetailPage() {
  const { id = "" } = useParams()
  const learner = useLearner(id)
  const enrolments = useLearnerEnrolments(id)
  const certificates = useLearnerCertificates(id)

  const name =
    learner.data?.full_name ||
    [learner.data?.first_name, learner.data?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Learner"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/platform/learners">
            <ArrowLeft className="mr-1.5 size-4" /> Back to learners
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/platform/learners/${id}/edit`}>
            <Pencil className="mr-1.5 size-4" /> Edit
          </Link>
        </Button>
      </div>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          {learner.isLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ) : learner.isError ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load this learner.
              </p>
              <Button variant="outline" size="sm" onClick={() => learner.refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl text-foreground">{name}</h1>
                  <Badge variant="outline" className="capitalize">
                    {learner.data?.role}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5" /> {learner.data?.email}
                  </span>
                  {learner.data?.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5" /> {learner.data.phone}
                    </span>
                  )}
                  {learner.data?.created_at && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" /> Joined{" "}
                      {format(new Date(learner.data.created_at), "d MMM yyyy")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Enrolments */}
        <Card>
          <CardHeader>
            <CardTitle>Course enrolments</CardTitle>
            <CardDescription>Progress across enrolled courses</CardDescription>
          </CardHeader>
          <CardContent>
            {enrolments.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : enrolments.isError ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Could not load enrolments.
              </p>
            ) : (enrolments.data?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <BookOpen className="size-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No enrolments yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {enrolments.data!.map((e) => (
                  <li key={e.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-foreground">
                        {e.courseTitle}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {e.progressPct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${e.progressPct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card>
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
            <CardDescription>Issued certificates and CPD hours</CardDescription>
          </CardHeader>
          <CardContent>
            {certificates.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : certificates.isError ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Could not load certificates.
              </p>
            ) : (certificates.data?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Award className="size-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No certificates issued yet.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {certificates.data!.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {c.courseTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.cpdHours} CPD hours · issued{" "}
                        {format(new Date(c.issuedAt), "d MMM yyyy")}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="shrink-0">
                      <Link to={`/resources/verify-certificate?id=${c.verificationUuid}`}>
                        Verify
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
