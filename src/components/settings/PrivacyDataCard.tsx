import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Download, Loader2, ShieldCheck } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { COMPANY } from "@/lib/constants"
import {
  buildPersonalDataExport,
  downloadPersonalDataExport,
} from "@/lib/queries/privacy.queries"

const LINK = "text-primary underline underline-offset-4"

/**
 * Where a person exercises their data rights.
 *
 * Access and portability are self-service, because they can be: the export
 * reads only the signed-in account's own rows. Correction is self-service too,
 * on the Account tab.
 *
 * Erasure is not a button. Training records and financial records have
 * retention periods, so a delete control here would either break those or
 * quietly not do what its label says. It goes to a person instead, who can
 * explain what can be removed and what has to be kept.
 */
export default function PrivacyDataCard(): React.ReactElement {
  const { user } = useAuth()
  const [exporting, setExporting] = useState(false)

  async function exportData(): Promise<void> {
    if (!user?.id) {
      toast.error("Sign in again to download your data.")
      return
    }
    setExporting(true)
    try {
      const data = await buildPersonalDataExport(user.id)
      downloadPersonalDataExport(data)
      if (data.unavailable.length > 0) {
        toast.warning("Downloaded, but some sections could not be read", {
          description: `Missing: ${data.unavailable.join(", ")}. Email ${COMPANY.email} and we will send them.`,
        })
      } else {
        toast.success("Your data has been downloaded")
      }
    } catch (err) {
      console.error("[PrivacyDataCard] export", err)
      toast.error("Could not build your download. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  const requestHref = `mailto:${COMPANY.email}?subject=${encodeURIComponent(
    "Data request",
  )}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-brand-navy" /> Your data and privacy
        </CardTitle>
        <CardDescription>
          What we hold about you, and how to ask us to change or remove it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Download your data</h3>
          <p className="text-sm text-muted-foreground">
            A copy of your profile, enrolments, progress, assessment attempts,
            certificates, attendance, bookings and notifications, as a JSON file
            you can keep or hand to another system. It covers your own records
            only.
          </p>
          <Button
            onClick={exportData}
            disabled={exporting}
            variant="outline"
            className="focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          >
            {exporting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Preparing
              </>
            ) : (
              <>
                <Download className="size-4" /> Download my data
              </>
            )}
          </Button>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Correct your details</h3>
          <p className="text-sm text-muted-foreground">
            Your name, contact details and emergency contact are on the Account
            tab and you can edit them yourself at any time. If something we hold
            elsewhere is wrong, tell us and we will correct it.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Deleting your account</h3>
          <p className="text-sm text-muted-foreground">
            Ask us and we will remove what we can. We cannot delete everything on
            request: training records and certificates are kept for 7 years, and
            invoices for 6 years, because we are required to hold them. We will
            tell you exactly what stays, what goes, and when the rest is due to be
            removed.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Making a request</h3>
          <p className="text-sm text-muted-foreground">
            Email{" "}
            <a className={LINK} href={requestHref}>
              {COMPANY.email}
            </a>{" "}
            or call {COMPANY.phone}. We reply from the address on your account so
            we know the request is really yours. Please do not send identity
            documents unless we ask. We answer within one month, and there is no
            charge.
          </p>
          <p className="text-sm text-muted-foreground">
            Our{" "}
            <Link className={LINK} to="/privacy-policy">
              Privacy Policy
            </Link>{" "}
            explains what we collect and why, and the{" "}
            <Link className={LINK} to="/cookie-policy">
              Cookie Policy
            </Link>{" "}
            lists what is stored in your browser.
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
