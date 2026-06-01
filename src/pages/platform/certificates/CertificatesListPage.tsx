import { useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"
import { Award, AlertCircle, Download, Plus, BadgeCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
import { useCertificates, useIssueCertificate } from "@/lib/queries/certificates.queries"
import { useLearners } from "@/lib/queries/learners.queries"
import { useCourses } from "@/lib/queries/courses.queries"
import { downloadCertificatePdf } from "@/lib/certificates/pdf"

function IssueDialog() {
  const [open, setOpen] = useState(false)
  const [learnerId, setLearnerId] = useState("")
  const [courseId, setCourseId] = useState("none")
  const [cpd, setCpd] = useState("0")
  const learners = useLearners()
  const courses = useCourses()
  const issue = useIssueCertificate()

  function submit() {
    if (!learnerId) return toast.error("Choose a learner")
    issue
      .mutateAsync({
        learnerId,
        courseId: courseId === "none" ? null : courseId,
        cpdHours: Number(cpd) || 0,
        expiresAt: null,
      })
      .then(() => {
        toast.success("Certificate issued")
        setOpen(false)
        setLearnerId("")
        setCourseId("none")
        setCpd("0")
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
  const { data, isLoading, isError, refetch } = useCertificates()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Certificates</h1>
          <p className="mt-1 text-muted-foreground">
            Issued certificates, verifiable at {`${"vitalcare.uk"}/verify`}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/platform/certificates/templates">Template</Link>
          </Button>
          <IssueDialog />
        </div>
      </div>

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
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Download PDF"
                          onClick={() =>
                            downloadCertificatePdf({
                              learnerName: c.learnerName,
                              courseTitle: c.courseTitle,
                              cpdHours: c.cpdHours,
                              issuedAt: c.issuedAt,
                              verificationUuid: c.verificationUuid,
                            })
                          }
                        >
                          <Download className="size-4" />
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="size-8" aria-label="Verify">
                          <Link to={`/resources/verify-certificate?id=${c.verificationUuid}`}>
                            <BadgeCheck className="size-4" />
                          </Link>
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
    </div>
  )
}
