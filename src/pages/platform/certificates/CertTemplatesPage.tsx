import { Link } from "react-router-dom"
import { ArrowLeft, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { downloadCertificatePdf } from "@/lib/certificates/pdf"
import { LEADERSHIP } from "@/lib/constants"

export default function CertTemplatesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/platform/certificates">
          <ArrowLeft className="mr-1.5 size-4" /> Back to certificates
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display text-2xl">Certificate template</CardTitle>
            <CardDescription>
              The standard Vitalcare certificate issued to every learner.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              downloadCertificatePdf({
                learnerName: "Harni Muharami",
                courseTitle: "Moving and Handling",
                cpdHours: 3,
                issuedAt: new Date().toISOString(),
                verificationUuid: "00000000-0000-0000-0000-000000000000",
              })
            }
          >
            <Download className="mr-2 size-4" /> Preview PDF
          </Button>
        </CardHeader>
        <CardContent>
          {/* On-screen preview (A4 landscape ratio) */}
          <div className="mx-auto aspect-[297/210] w-full rounded-md border-4 border-brand-gold bg-white p-6 shadow-sm">
            <div className="flex h-full flex-col items-center justify-center rounded border border-brand-navy/30 px-6 text-center">
              <p className="font-display text-2xl text-brand-navy sm:text-3xl">
                Certificate of Completion
              </p>
              <p className="mt-4 text-xs text-muted-foreground sm:text-sm">
                This is to certify that
              </p>
              <p className="mt-2 font-display text-2xl text-brand-navy sm:text-4xl">
                [Learner name]
              </p>
              <div className="mt-2 h-0.5 w-40 bg-brand-gold" />
              <p className="mt-3 text-xs text-muted-foreground sm:text-sm">
                has successfully completed
              </p>
              <p className="mt-1 font-display text-lg text-brand-navy sm:text-2xl">
                [Course title]
              </p>
              <p className="mt-3 text-[10px] text-muted-foreground sm:text-xs">
                [CPD hours] CPD hours · CSTF-aligned, CPD-accredited · verifiable at
                vitalcare.uk/verify
              </p>
              <p className="mt-6 text-[10px] font-semibold text-brand-navy sm:text-xs">
                Overseen by {LEADERSHIP.clinicalDirector.name}, Clinical Director
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
