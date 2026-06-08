import { useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"
import { Award, AlertCircle, Download, Plus, BadgeCheck, Clock, Eye, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useCertificates,
  useApproveCertificate,
  useIssueCertificate,
  useDefaultTemplate,
  DEFAULT_TEMPLATE,
  type CertRow,
  type CertTemplate,
} from "@/lib/queries/certificates.queries"
import { useLearners } from "@/lib/queries/learners.queries"
import { useCourses } from "@/lib/queries/courses.queries"
import { downloadCertificatePdf } from "@/lib/certificates/pdf"
import { CertificatePreview } from "@/components/certificates/CertificatePreview"
import VerifyCertDialog from "@/components/certificates/VerifyCertDialog"
import { useUser } from "@/hooks/use-user"

function ExpiryBadge({ cert }: { cert: CertRow }) {
  if (cert.status === "expired") {
    return (
      <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
        Expired
      </Badge>
    )
  }
  if (cert.status === "expiring") {
    return (
      <Badge variant="outline" className="border-warning/50 bg-warning/10 text-warning">
        <Clock className="mr-1 size-3" />
        {cert.daysToExpiry === 0
          ? "Expires today"
          : `${cert.daysToExpiry}d left`}
      </Badge>
    )
  }
  if (cert.status === "active") {
    return (
      <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
        In date
      </Badge>
    )
  }
  return <span className="text-xs text-muted-foreground">No expiry</span>
}

/** Default expiry: one year from today, as a yyyy-mm-dd string for the date input. */
function oneYearFromToday(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

function IssueDialog() {
  const [open, setOpen] = useState(false)
  const [learnerId, setLearnerId] = useState("")
  const [courseId, setCourseId] = useState("none")
  const [cpd, setCpd] = useState("0")
  const [expiry, setExpiry] = useState(oneYearFromToday())
  const learners = useLearners()
  const courses = useCourses()
  const issue = useIssueCertificate()

  function submit() {
    if (!learnerId) return toast.error("Choose a learner")
    // Send the chosen expiry as an ISO timestamp so the alert pipeline fires.
    // A cleared date means the certificate never expires.
    const expiresAt = expiry ? new Date(`${expiry}T00:00:00`).toISOString() : null
    issue
      .mutateAsync({
        learnerId,
        courseId: courseId === "none" ? null : courseId,
        cpdHours: Number(cpd) || 0,
        expiresAt,
      })
      .then(() => {
        toast.success("Certificate issued")
        setOpen(false)
        setLearnerId("")
        setCourseId("none")
        setCpd("0")
        setExpiry(oneYearFromToday())
      })
      .catch(() => toast.error("Could not issue certificate"))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" /> Issue certificate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Issue a certificate</DialogTitle>
          <DialogDescription>
            Creates a verifiable certificate for a learner.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Learner</Label>
            <Select value={learnerId} onValueChange={setLearnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a learner" />
              </SelectTrigger>
              <SelectContent>
                {(learners.data ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Course (optional)</Label>
            <Select
              value={courseId}
              onValueChange={(v) => {
                setCourseId(v)
                const c = courses.data?.find((x) => x.id === v)
                if (c) setCpd(String(c.cpdHours))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Standalone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Standalone</SelectItem>
                {(courses.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>CPD hours</Label>
            <Input type="number" min={0} step="0.5" value={cpd} onChange={(e) => setCpd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-expiry">Expiry date</Label>
            <Input
              id="cert-expiry"
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Defaults to one year from today. The owner is alerted as it nears
              expiry. Clear the date for a certificate that never expires.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={issue.isPending}>
            {issue.isPending ? "Issuing…" : "Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CertificatesListPage() {
  const { isAdmin, isTrainer } = useUser()
  const isStaff = isAdmin || isTrainer
  const { data, isLoading, isError, refetch } = useCertificates()
  const approve = useApproveCertificate()
  const [verifyCode, setVerifyCode] = useState<string | null>(null)
  const template = useDefaultTemplate()
  const [signatory, setSignatory] = useState("")
  const [signatoryRole, setSignatoryRole] = useState("")
  const [preview, setPreview] = useState<CertRow | null>(null)

  const baseTpl = template.data ?? DEFAULT_TEMPLATE
  const previewTemplate: CertTemplate = {
    ...baseTpl,
    signatoryName: signatory || baseTpl.signatoryName,
    signatoryRole: signatoryRole || baseTpl.signatoryRole,
  }

  function runDownload(c: CertRow) {
    // A learner cannot download a certificate that has not been approved.
    if (!c.approved && !isStaff) {
      toast.error("This certificate is awaiting admin approval.")
      return
    }
    downloadCertificatePdf({
      learnerName: c.learnerName,
      courseTitle: c.courseTitle,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      verificationUuid: c.verificationUuid,
      verificationCode: c.verificationCode,
      titleText: baseTpl.titleText,
      introText: baseTpl.introText,
      completionText: baseTpl.completionText,
      accreditationLine: baseTpl.accreditationLine,
      footerText: baseTpl.footerText,
      signatoryName: previewTemplate.signatoryName,
      signatoryRole: previewTemplate.signatoryRole,
    }).catch(() => toast.error("Could not generate the certificate PDF."))
  }

  const expiringCount =
    data?.filter((c) => c.status === "expiring" || c.status === "expired").length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Certificates</h1>
          <p className="mt-1 text-muted-foreground">
            {isStaff
              ? `Issued certificates, verifiable at vitalcare.uk/verify.`
              : `Your certificates, verifiable at vitalcare.uk/verify.`}
          </p>
        </div>
        {isStaff && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/platform/certificates/templates">Design template</Link>
            </Button>
            <IssueDialog />
          </div>
        )}
      </div>

      {expiringCount > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-warning/40 bg-warning/[0.06] px-4 py-3 text-sm">
          <Clock className="size-5 shrink-0 text-warning" />
          <p className="text-foreground">
            {expiringCount} certificate{expiringCount === 1 ? "" : "s"} expiring within
            30 days or already expired. Owners are alerted automatically.
          </p>
        </div>
      ) : null}

      {/* Signatory applied to downloaded certificates */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex-1 min-w-[180px]">
            <Label className="mb-1.5 block text-xs">Signatory name (on the certificate)</Label>
            <Input
              placeholder="e.g. Harni Muharami RN MSc"
              value={signatory}
              onChange={(e) => setSignatory(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <Label className="mb-1.5 block text-xs">Signatory role</Label>
            <Input
              placeholder="e.g. Clinical Director"
              value={signatoryRole}
              onChange={(e) => setSignatoryRole(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Leave blank to use the Clinical Director by default.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load certificates.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Award className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                No certificates issued yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>CPD</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.learnerName}</TableCell>
                    <TableCell className="text-muted-foreground">{c.courseTitle}</TableCell>
                    <TableCell>{c.cpdHours}h</TableCell>
                    <TableCell>{format(new Date(c.issuedAt), "d MMM yyyy")}</TableCell>
                    <TableCell>
                      <ExpiryBadge cert={c} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {!c.approved && isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-success"
                            disabled={approve.isPending}
                            onClick={() =>
                              approve.mutate(c.id, {
                                onSuccess: () => toast.success("Certificate approved"),
                                onError: (e) =>
                                  toast.error(e instanceof Error ? e.message : "Could not approve"),
                              })
                            }
                          >
                            <CheckCircle2 className="size-4" /> Approve
                          </Button>
                        )}
                        {!c.approved && !isStaff && (
                          <span className="text-xs text-warning">Awaiting approval</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Preview certificate"
                          onClick={() => setPreview(c)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        {(c.approved || isStaff) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Download PDF"
                            onClick={() => runDownload(c)}
                          >
                            <Download className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Verify"
                          onClick={() => setVerifyCode(c.verificationCode || c.verificationUuid)}
                        >
                          <BadgeCheck className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display">Certificate preview</DialogTitle>
            <DialogDescription>
              {preview ? `${preview.learnerName} · ${preview.courseTitle}` : ""}
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            <CertificatePreview
              template={previewTemplate}
              values={{
                learnerName: preview.learnerName,
                courseTitle: preview.courseTitle,
                issuedAt: preview.issuedAt,
                expiresAt: preview.expiresAt,
                verificationUuid: preview.verificationUuid,
                verificationCode: preview.verificationCode,
              }}
            />
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                preview && setVerifyCode(preview.verificationCode || preview.verificationUuid)
              }
            >
              <BadgeCheck className="mr-2 size-4" /> Verify
            </Button>
            <Button onClick={() => preview && runDownload(preview)}>
              <Download className="mr-2 size-4" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VerifyCertDialog code={verifyCode} onClose={() => setVerifyCode(null)} />
    </div>
  )
}
