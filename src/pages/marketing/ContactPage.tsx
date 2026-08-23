import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Linkedin,
  Instagram,
  MessageCircle,
  ArrowRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/marketing/PageHero"
import { supabase } from "@/lib/supabase/client"
import { COMPANY, SOCIAL_LINKS } from "@/lib/constants"
import { PageMeta } from "@/components/seo/PageMeta"

const contactSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Enter a subject"),
  message: z.string().min(10, "Tell us a little more (at least 10 characters)"),
  website: z.string().optional(), // honeypot
})
type ContactValues = z.infer<typeof contactSchema>

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
const FIELD = `h-11 rounded-xl ${FOCUS}`

export default function ContactPage(): React.ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) })

  const onSubmit = async (values: ContactValues): Promise<void> => {
    try {
      const { error } = await supabase.functions.invoke("contact-form", {
        body: {
          name: values.name,
          email: values.email,
          phone: values.phone ?? "",
          subject: values.subject,
          message: values.message,
          website: values.website ?? "",
        },
      })
      if (error) {
        console.error("[contact-form]", error)
        toast.error("We could not send your message", {
          description: `Please email us at ${COMPANY.email} or call ${COMPANY.phone}.`,
        })
        return
      }
      toast.success("Message sent", {
        description: "Thank you. We will be in touch soon.",
      })
      reset()
    } catch (err) {
      console.error("[contact-form]", err)
      toast.error("We could not send your message", {
        description: `Please email us at ${COMPANY.email} or call ${COMPANY.phone}.`,
      })
    }
  }

  return (
    <>
      <PageMeta
        title="Contact us"
        description="Talk to the Vitalcare team about training for your organisation. 11 Halesworth Road, London SE13 7TJ. 020 8059 8757."
        canonicalPath="/contact-us"
      />
      <PageHero
        eyebrow="Contact us"
        title="Talk to the Vitalcare team"
        description="Tell us about your team and what you need. We will get back to you quickly."
      />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-5 lg:gap-10 lg:px-8 lg:py-28">
        {/* Left: company info */}
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1b2e6b] via-[#142054] to-[#0d1530] px-7 py-9">
              <div
                className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand-gold/20 blur-3xl"
                aria-hidden="true"
              />
              <p className="relative inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-brand-gold">
                <span className="h-px w-8 bg-brand-gold/70" aria-hidden="true" />
                Get in touch
              </p>
              <h2 className="relative mt-3 font-sans text-2xl font-semibold tracking-tight text-white">
                We answer training questions fast
              </h2>
              <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-white/80">
                Reach us directly, or send the form and a member of the team will
                reply.
              </p>
            </div>

            <ul className="space-y-1 p-5 text-sm sm:p-6">
              <li className="flex items-start gap-3.5 py-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-navy">
                  <MapPin className="size-5" />
                </span>
                <span className="pt-1.5 text-foreground">
                  {COMPANY.address.line1}
                  <br />
                  {COMPANY.address.city} {COMPANY.address.postcode}
                </span>
              </li>
              <li className="flex items-center gap-3.5 py-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-navy">
                  <Phone className="size-5" />
                </span>
                <a
                  href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                  className={`rounded text-foreground transition-colors hover:text-brand-navy ${FOCUS}`}
                >
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex items-center gap-3.5 py-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-navy">
                  <Mail className="size-5" />
                </span>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className={`rounded text-foreground transition-colors hover:text-brand-navy ${FOCUS}`}
                >
                  {COMPANY.email}
                </a>
              </li>
            </ul>

            {/* WhatsApp + socials */}
            <div className="border-t border-border px-5 py-6 sm:px-6">
              <a
                href={SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1ebe5d] ${FOCUS}`}
              >
                <MessageCircle className="size-5" /> Chat on WhatsApp
              </a>
              <div className="mt-5 flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Follow us
                </span>
                {[
                  { label: "LinkedIn", href: SOCIAL_LINKS.linkedin, Icon: Linkedin },
                  { label: "Instagram", href: SOCIAL_LINKS.instagram, Icon: Instagram },
                ].map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`flex size-9 items-center justify-center rounded-full border border-border text-brand-navy transition-colors hover:border-brand-navy hover:bg-muted ${FOCUS}`}
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-navy">
                <Clock className="size-5" />
              </span>
              <h2 className="font-sans text-xl font-semibold tracking-tight text-brand-navy">
                Office hours
              </h2>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <dt className="text-muted-foreground">Monday to Friday</dt>
                <dd className="font-semibold text-foreground">9am to 5pm</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Saturday and Sunday</dt>
                <dd className="font-semibold text-foreground">Closed</dd>
              </div>
            </dl>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-brand-gold/30 bg-brand-gold/[0.06] p-6 shadow-sm">
            <ShieldCheck
              className="mt-0.5 size-5 shrink-0 text-brand-gold"
              aria-hidden="true"
            />
            <p className="text-sm leading-relaxed text-foreground">
              {COMPANY.legalName}, company number {COMPANY.companyNumber},
              registered in {COMPANY.jurisdiction}.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-9">
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-brand-navy">
              Send us a message
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Fields marked with an asterisk are required.
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="mt-7 grid gap-5"
            >
              {/* Honeypot: hidden from users and screen readers; bots fill it. */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
                {...register("website")}
              />
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  className={FIELD}
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    className={FIELD}
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  {errors.email ? (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    className={FIELD}
                    {...register("phone")}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  className={FIELD}
                  aria-invalid={!!errors.subject}
                  {...register("subject")}
                />
                {errors.subject ? (
                  <p className="text-sm text-destructive">
                    {errors.subject.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="message">Message *</Label>
                <textarea
                  id="message"
                  rows={6}
                  className={`flex w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm ring-offset-background placeholder:text-muted-foreground ${FOCUS}`}
                  aria-invalid={!!errors.message}
                  {...register("message")}
                />
                {errors.message ? (
                  <p className="text-sm text-destructive">
                    {errors.message.message}
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className={`group h-12 w-full rounded-xl bg-brand-navy text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark ${FOCUS}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending
                  </>
                ) : (
                  <>
                    Send message
                    <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
