import { PageHero } from "@/components/marketing/PageHero"
import { CTABand } from "@/components/marketing/CTABand"
import { LEADERSHIP } from "@/lib/constants"

const ITEMS = [
  {
    title: "CSTF alignment",
    body: "Our statutory and mandatory courses map to the Core Skills Training Framework subjects and learning outcomes by staff group, so completed training is recognised across NHS organisations.",
  },
  {
    title: "CPD accreditation",
    body: "Courses are CPD-accredited with logged hours, supporting revalidation and professional portfolios for nurses, carers and allied professionals.",
  },
  {
    title: "CQC compliance",
    body: "Reporting is designed around the questions inspectors ask, so providers can evidence safe, effective and well-led training at inspection.",
  },
  {
    title: "Registered nurse oversight",
    body: `Clinical content is overseen by ${LEADERSHIP.clinicalDirector.name}, our Clinical Director, keeping training aligned to current practice.`,
  },
]

export default function AccreditationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Accreditations"
        title="Standards you can evidence"
        description="CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify."
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {ITEMS.map((item) => (
            <div key={item.title} className="rounded-xl border border-border p-8">
              <h2 className="text-lg font-semibold text-brand-navy">
                {item.title}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
      <CTABand />
    </>
  )
}
