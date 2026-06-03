import { Link } from "react-router-dom"
import { ShieldCheck, Award, ClipboardCheck, Stethoscope, ArrowRight } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { CTABand } from "@/components/marketing/CTABand"
import { LEADERSHIP } from "@/lib/constants"

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "CSTF alignment",
    body: "Our statutory and mandatory courses map to the Core Skills Training Framework subjects and learning outcomes by staff group, so completed training is recognised across NHS organisations.",
  },
  {
    icon: Award,
    title: "CPD accreditation",
    body: "Courses are CPD-accredited with logged hours, supporting revalidation and professional portfolios for nurses, carers and allied professionals.",
  },
  {
    icon: ClipboardCheck,
    title: "CQC compliance",
    body: "Reporting is designed around the questions inspectors ask, so providers can evidence safe, effective and well-led training at inspection.",
  },
  {
    icon: Stethoscope,
    title: "Registered nurse oversight",
    body: `Clinical content is overseen by ${LEADERSHIP.clinicalDirector.name}, our Clinical Director, keeping training aligned to current practice.`,
  },
] as const

const BADGE_MEANINGS = [
  {
    badge: "CSTF Aligned",
    meaning:
      "Content maps to the agreed Core Skills Training Framework subjects for the relevant staff group, so training is portable between NHS organisations.",
  },
  {
    badge: "CPD Accredited",
    meaning:
      "The course carries Continuing Professional Development accreditation with logged hours that count towards revalidation and professional portfolios.",
  },
  {
    badge: "Verifiable Certificate",
    meaning:
      "Each certificate carries a reference that can be checked at vitalcare.uk/verify, so employers and inspectors can confirm completion.",
  },
] as const

export default function AccreditationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Accreditations"
        title="Standards you can evidence"
        description="CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify."
      />

      {/* Accreditation pillars */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {ITEMS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border p-8">
              <span className="flex size-11 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-gold">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-brand-navy">
                {title}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What the badges mean */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl text-brand-navy">
            What the badges mean
          </h2>
          <p className="mt-2 text-muted-foreground">
            The marks you see on our courses and certificates, in plain terms.
          </p>
          <dl className="mt-8 space-y-6">
            {BADGE_MEANINGS.map((item) => (
              <div
                key={item.badge}
                className="rounded-xl border border-border bg-white p-6"
              >
                <dt className="text-base font-semibold text-brand-navy">
                  {item.badge}
                </dt>
                <dd className="mt-2 text-sm text-muted-foreground">
                  {item.meaning}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Verification */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-brand-navy p-8 sm:p-10">
          <h2 className="font-display text-2xl text-white sm:text-3xl">
            Verify a certificate
          </h2>
          <p className="mt-3 max-w-2xl text-white/80">
            Confirm that a Vitalcare certificate is genuine and in date. Enter
            the certificate reference to check completion, the course and the
            date awarded.
          </p>
          <Link
            to="/resources/verify-certificate"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
          >
            Verify a certificate
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <CTABand />
    </>
  )
}
