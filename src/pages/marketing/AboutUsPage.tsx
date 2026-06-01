import { PageHero } from "@/components/marketing/PageHero"
import { CTABand } from "@/components/marketing/CTABand"
import { LEADERSHIP, COMPANY, ACCREDITATION } from "@/lib/constants"

const CREDENTIALS = [
  { label: "Company number", value: COMPANY.companyNumber },
  { label: "Founded", value: COMPANY.founded },
  { label: "NHS framework", value: ACCREDITATION.nhsFramework },
  { label: "Accreditation", value: ACCREDITATION.cpd },
]

export default function AboutUsPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Healthcare training with clinical credibility"
        description="Vitalcare Training Hub was founded in May 2024 in south-east London to give healthcare providers training they can trust and evidence."
      />

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl text-brand-navy">Our story</h2>
        <div className="mt-4 space-y-4 text-muted-foreground">
          <p>
            We started Vitalcare because too much healthcare training was hard
            to evidence and disconnected from current clinical practice. Care
            providers were paying for courses that did not map cleanly to the
            standards they answer to, and chasing paper certificates at
            inspection.
          </p>
          <p>
            From our base at {COMPANY.address.line1}, {COMPANY.address.city}, we
            build CSTF-aligned, CPD-accredited training for NHS Trusts, care
            homes, GP practices and individual professionals. Every course is
            overseen by a registered nurse, and every certificate is verifiable
            online.
          </p>
        </div>
      </section>

      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl text-brand-navy">Leadership</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {[LEADERSHIP.ceo, LEADERSHIP.clinicalDirector].map((person) => (
              <div
                key={person.email}
                className="rounded-xl border border-border bg-white p-8"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-brand-navy font-display text-xl text-white">
                  {person.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-brand-navy">
                  {person.name}
                </h3>
                <p className="text-sm font-medium text-brand-gold">
                  {person.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl text-brand-navy">Credentials</h2>
        <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CREDENTIALS.map((item) => (
            <div key={item.label} className="rounded-xl border border-border p-6">
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 text-lg font-semibold text-brand-navy">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-muted-foreground">
          {COMPANY.legalName} is registered in {COMPANY.jurisdiction}, company
          number {COMPANY.companyNumber}. Clinical oversight is provided by{" "}
          {LEADERSHIP.clinicalDirector.name}.
        </p>
      </section>

      <CTABand />
    </>
  )
}
