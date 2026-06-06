import { useState } from "react"
import { toast } from "sonner"
import { Award, Download, FileText, FolderOpen, Loader2 } from "lucide-react"

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
import { useCertificates } from "@/lib/queries/certificates.queries"
import { useMyCourses } from "@/lib/queries/courses.queries"
import { useMyResources } from "@/lib/queries/library.queries"
import { downloadCertificatePdf } from "@/lib/certificates/pdf"

export default function MyFilesPage() {
  const certs = useCertificates()
  const myCourses = useMyCourses()
  const resources = useMyResources("learner")
  const [downloading, setDownloading] = useState<string | null>(null)

  // Workbooks and resources from courses the learner has completed.
  const completedCourseIds = new Set(
    (myCourses.data ?? [])
      .filter((m) => m.enrolled && m.progressPct >= 100)
      .map((m) => m.course.id),
  )
  const completedMaterials = (resources.data ?? []).filter(
    (r) => r.courseId && completedCourseIds.has(r.courseId),
  )

  async function downloadCert(c: NonNullable<typeof certs.data>[number]) {
    setDownloading(c.id)
    try {
      await downloadCertificatePdf({
        learnerName: c.learnerName,
        courseTitle: c.courseTitle,
        issuedAt: c.issuedAt,
        expiresAt: c.expiresAt,
        verificationUuid: c.verificationUuid,
      })
    } catch (err) {
      console.error("[MyFiles:downloadCert]", err)
      toast.error("Could not generate the certificate")
    } finally {
      setDownloading(null)
    }
  }

  const loading = certs.isLoading || myCourses.isLoading || resources.isLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl text-foreground">
          <FolderOpen className="size-6 text-brand-navy" /> My Files
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your certificates and the workbooks from courses you have completed, in
          one place.
        </p>
      </div>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <Award className="size-5 text-brand-gold" /> Certificates
          </CardTitle>
          <CardDescription>Download any certificate you have earned.</CardDescription>
        </CardHeader>
        <CardContent>
          {certs.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : certs.isError ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Could not load certificates.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => certs.refetch()}>
                Retry
              </Button>
            </div>
          ) : (certs.data ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No certificates yet. Complete a course and pass its assessment to earn one.
            </p>
          ) : (
            <ul className="space-y-2">
              {(certs.data ?? []).map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                >
                  <Award className="size-4 shrink-0 text-brand-gold" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.courseTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.certificateNumber} · issued{" "}
                      {new Date(c.issuedAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      c.status === "expired"
                        ? "text-[10px] border-destructive/30 bg-destructive/10 text-destructive"
                        : "text-[10px] border-success/30 bg-success/10 text-success"
                    }
                  >
                    {c.status === "expired" ? "Expired" : "Active"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    disabled={downloading === c.id}
                    onClick={() => downloadCert(c)}
                  >
                    {downloading === c.id ? (
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                    ) : (
                      <Download className="mr-1.5 size-4" />
                    )}
                    Download
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Completed-course workbooks and materials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <FileText className="size-5 text-brand-navy" /> Course workbooks
          </CardTitle>
          <CardDescription>
            Workbooks and resources from courses you have completed, for your review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-14 w-full" />
          ) : completedMaterials.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              Workbooks from your completed courses will appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {completedMaterials.map((r) => (
                <li key={r.id}>
                  <a
                    href={r.fileUrl || r.linkUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                      {r.courseTitle && (
                        <p className="truncate text-xs text-muted-foreground">{r.courseTitle}</p>
                      )}
                    </div>
                    <Download className="ml-auto size-4 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
