import { useState, type JSX } from "react"
import { toast } from "sonner"
import { Database, Download, FileSpreadsheet, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCertificates } from "@/lib/queries/certificates.queries"
import { useLearners } from "@/lib/queries/learners.queries"
import { useInvoices } from "@/lib/queries/invoices.queries"
import { useAnalyticsSummary } from "@/lib/queries/analytics.queries"
import { useStaffMatrix } from "@/lib/queries/compliance.queries"
import { downloadWorkbook } from "@/lib/exports/download"
import { REPORTS, type ReportId, type ReportMeta } from "@/lib/exports/registry"
import type { WorkbookSpec } from "@/lib/exports/types"
import { buildCertificateLogLive } from "@/lib/exports/builders/certificate-log"
import { buildLearnerProgressLive } from "@/lib/exports/builders/learner-progress"
import { buildFinanceTrackerLive } from "@/lib/exports/builders/finance-tracker"
import { buildBusinessOverviewLive } from "@/lib/exports/builders/business-overview"
import { buildTrainingMatrixLive } from "@/lib/exports/builders/training-matrix"

type Mode = "template" | "live"

export default function ReportsPage(): JSX.Element {
  const certificates = useCertificates()
  const learners = useLearners()
  const invoices = useInvoices(true)
  const summary = useAnalyticsSummary()
  const matrix = useStaffMatrix()

  // Key is `${id}:${mode}` so each button tracks its own spinner.
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  /** Whether a report's live source is still loading. */
  function liveLoading(id: ReportId): boolean {
    switch (id) {
      case "certificate-log":
        return certificates.isLoading
      case "learner-progress":
        return learners.isLoading
      case "finance-tracker":
        return invoices.isLoading
      case "business-overview":
        return summary.isLoading || invoices.isLoading
      case "training-matrix":
        return matrix.isLoading
      default:
        return false
    }
  }

  /**
   * Whether a report's live source failed to load.
   *
   * This matters more here than anywhere else in the app: every builder was
   * called with `data ?? []`, so a failed query exported a valid-looking
   * workbook containing nothing. A compliance report that says an organisation
   * has issued no certificates, when in fact the query broke, is worse than no
   * report at all, because somebody files it.
   */
  function liveError(id: ReportId): boolean {
    switch (id) {
      case "certificate-log":
        return certificates.isError
      case "learner-progress":
        return learners.isError
      case "finance-tracker":
        return invoices.isError
      case "business-overview":
        return summary.isError || invoices.isError
      case "training-matrix":
        return matrix.isError
      default:
        return false
    }
  }

  /** Build the live workbook for a report, or null if its data is unavailable. */
  function liveSpec(id: ReportId): WorkbookSpec | null {
    switch (id) {
      case "certificate-log":
        return buildCertificateLogLive(certificates.data ?? [])
      case "learner-progress":
        return buildLearnerProgressLive(learners.data ?? [])
      case "finance-tracker":
        return buildFinanceTrackerLive(invoices.data ?? [])
      case "business-overview": {
        if (!summary.data) return null
        const paidPence = (invoices.data ?? [])
          .filter((inv) => inv.status === "paid")
          .reduce((sum, inv) => sum + inv.total_pence, 0)
        return buildBusinessOverviewLive(summary.data, paidPence / 100)
      }
      case "training-matrix":
        return matrix.data ? buildTrainingMatrixLive(matrix.data) : null
      default:
        return null
    }
  }

  /** Count of live rows, used to warn when an export would be empty. */
  function liveCount(id: ReportId): number {
    switch (id) {
      case "certificate-log":
        return certificates.data?.length ?? 0
      case "learner-progress":
        return learners.data?.length ?? 0
      case "finance-tracker":
        return invoices.data?.length ?? 0
      case "business-overview":
        return summary.data ? 1 : 0
      case "training-matrix":
        return matrix.data?.staff.length ?? 0
      default:
        return 0
    }
  }

  async function handleDownload(report: ReportMeta, mode: Mode): Promise<void> {
    const key = `${report.id}:${mode}`
    setBusy((prev) => ({ ...prev, [key]: true }))
    try {
      if (mode === "live" && liveError(report.id)) {
        toast.error("This report's data could not be loaded", {
          description:
            "Exporting now would produce an empty report. Reload the page and try again.",
        })
        return
      }
      const spec =
        mode === "template" ? report.template() : liveSpec(report.id)
      if (!spec) {
        toast.error("Live data is not ready yet. Please try again in a moment.")
        return
      }
      await downloadWorkbook(spec)
      if (mode === "live" && liveCount(report.id) === 0) {
        toast.success("Exported a styled workbook", {
          description: "No records yet, so only the headings were filled in.",
        })
      } else {
        toast.success(
          mode === "template"
            ? "Template downloaded"
            : "Live data exported",
        )
      }
    } catch (err) {
      console.error("[ReportsPage:download]", err)
      toast.error("Download failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">
          Reports and templates
        </h1>
        <p className="mt-1 text-muted-foreground">
          Download branded spreadsheets, ready to fill in or filled with your
          live platform data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => {
          const templateBusy = busy[`${report.id}:template`] ?? false
          const liveBusy = busy[`${report.id}:live`] ?? false
          const fetching = report.live && liveLoading(report.id)
          const failed = report.live && liveError(report.id)
          return (
            <Card key={report.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                    <FileSpreadsheet className="size-5" />
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      report.live
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {report.live ? "Live data" : "Template only"}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-lg">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(report, "template")}
                  disabled={templateBusy}
                >
                  {templateBusy ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 size-4" />
                  )}
                  Download template
                </Button>
                {report.live && (
                  <>
                    <Button
                      onClick={() => handleDownload(report, "live")}
                      disabled={liveBusy || fetching || failed}
                      className="bg-brand-navy hover:bg-brand-navy-dark"
                    >
                      {liveBusy || fetching ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Database className="mr-2 size-4" />
                      )}
                      Export live data
                    </Button>
                    {failed && (
                      <p role="alert" className="text-xs text-destructive">
                        This report's data could not be loaded, so it cannot be
                        exported. Reload the page and try again.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
