import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Mail, Phone, MapPin, Clock, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/marketing/PageHero"
import { supabase } from "@/lib/supabase/client"
import { COMPANY } from "@/lib/constants"
import Turnstile from "@/components/security/Turnstile"
import { turnstileEnabled } from "@/lib/turnstile"

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

export default function ContactPage(): React.ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) })

  const [captchaToken, setCaptchaToken] = useState("")

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
          turnstileToken: captchaToken,
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
      <PageHero
        eyebrow="Contact us"
        title="Talk to the Vitalcare team"
        description="Tell us about your team and what you need. We will get back to you quickly."
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-5 lg:gap-12 lg:px-8 lg:py-28">
        {/* Left: company info */}
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1b2e6b] via-[#142054] to-[#0d1530] px-7 py-8">
              <div
                className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand-gold/20 blur-3xl"
                aria-hidden="true"
              />
              <p className="relative inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
                <span className="h-px w-8 bg-brand-gold/70" aria-hidden="true" />
                Get in touch
              </p>
              <h2 className="relative mt-3 font-sans font-semibold tracking-tight text-2xl text-white">
                We answer training questions fast
              </h2>
              <p className="relative mt-2 text-sm leading-relaxed text-white/80">
                Reach us directly, or send the form and a member of the team
                will reply.
              </p>
            </div>

            <ul className="space-y-5 px-7 py-7 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-navy">
                  <MapPin className="size-5" />
                </span>
                <span className="text-foreground">
                  {COMPANY.address.line1}
                  <br />
                  {COMPANY.address.city} {COMPANY.address.postcode}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-navy">
                  <Phone className="size-5" />
                </span>
                <a
                  href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                  className={`rounded text-foreground hover:text-brand-navy ${FOCUS}`}
                >
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-navy">
                  <Mail className="size-5" />
                </span>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className={`rounded text-foreground hover:text-brand-navy ${FOCUS}`}
                >
                  {COMPANY.email}
                </a>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-navy">
                <Clock className="size-5" />
              </span>
              <h2 className="font-sans font-semibold tracking-tight text-xl text-brand-navy">
                Office hours
              </h2>
            </div>
            <dl className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <dt>Monday to Friday</dt>
                <dd className="font-medium text-foreground">9am to 5pm</dd>
              </div>
              <div className="flex justify-between">
                <dt>Saturday and Sunday</dt>
                <dd className="font-medium text-foreground">Closed</dd>
              </div>
            </dl>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-brand-gold/30 bg-brand-gold/[0.06] p-6">
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
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-sans font-semibold tracking-tight text-2xl text-brand-navy">
              Send us a message
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fields marked with an asterisk are required.
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="mt-6 grid gap-5"
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
                  className={FOCUS}
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
                    className={FOCUS}
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
                    className={FOCUS}
                    {...register("phone")}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  className={FOCUS}
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
                  className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground ${FOCUS}`}
                  aria-invalid={!!errors.message}
                  {...register("message")}
                />
                {errors.message ? (
                  <p className="text-sm text-destructive">
                    {errors.message.message}
                  </p>
                ) : null}
              </div>

              <Turnstile onVerify={setCaptchaToken} />

              <Button
                type="submit"
                disabled={isSubmitting || (turnstileEnabled() && !captchaToken)}
                className={`w-full sm:w-auto ${FOCUS}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending
                  </>
                ) : (
                  "Send message"
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
