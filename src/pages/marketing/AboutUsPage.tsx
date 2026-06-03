import { Link } from "react-router-dom"
import { Target, ShieldCheck, BadgeCheck, ArrowRight } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { CTABand } from "@/components/marketing/CTABand"
import { LEADERSHIP, COMPANY, ACCREDITATION } from "@/lib/constants"

const CREDENTIALS = [
  { label: "Company number", value: COMPANY.companyNumber },
  { label: "Founded", value: COMPANY.founded },
  { label: "NHS framework", value: ACCREDITATION.nhsFramework },
  { label: "Accreditation", value: ACCREDITATION.cpd },
] as const

const PRINCIPLES = [
  {
    icon: Target,
    title: "Evidence first",
    body: "Training that maps cleanly to the standards providers answer to, with records governance teams can produce at inspection.",
  },
  {
    icon: ShieldCheck,
    title: "Clinical credibility",
    body: "Every course is overseen by a registered nurse, so content stays aligned to current practice.",
  },
  {
    icon: BadgeCheck,
    title: "Verifiable on completion",
    body: "Certificates are verifiable at vitalcare.uk/verify, so completion is simple to share and check.",
  },
] as const

export default function AboutUsPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Healthcare training with clinical credibility"
        description="Vitalcare Training Hub was founded in May 2024 in south-east London to give healthcare providers training they can trust and evidence."
      />

      {/* Story */}
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

      {/* Mission */}
      <section className="bg-brand-navy">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
            Our mission
          </p>
          <p className="mt-4 font-display text-2xl leading-relaxed text-white sm:text-3xl">
            To give healthcare providers training they can trust, deliver and
            evidence, so staff are confident in their roles and patients receive
            safe care.
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl text-brand-navy">
          What we stand by
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <span className="flex size-11 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-gold">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-brand-navy">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Leadership */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl text-brand-navy">Leadership</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Vitalcare is led by a founder team with operational and clinical
            experience.
          </p>
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
                <p className="mt-3 text-sm text-muted-foreground">
                  {person.email === LEADERSHIP.ceo.email
                    ? "Leads the direction of Vitalcare Training Hub, from product to the partnerships we build with providers."
                    : "Oversees clinical content as a registered nurse, keeping every course aligned to current practice."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accreditation + credentials */}
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
        <Link
          to="/resources/accreditations"
          className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          Read about our accreditation
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>

      <CTABand />
    </>
  )
}
