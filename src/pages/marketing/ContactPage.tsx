import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Mail, Phone, MapPin, Clock } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { COMPANY } from "@/lib/constants"

const contactSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Enter a subject"),
  message: z.string().min(10, "Tell us a little more (at least 10 characters)"),
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

  const onSubmit = async (values: ContactValues): Promise<void> => {
    try {
      const { error } = await supabase.functions.invoke("contact-form", {
        body: {
          name: values.name,
          email: values.email,
          phone: values.phone ?? "",
          subject: values.subject,
          message: values.message,
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

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-5 lg:gap-12 lg:px-8">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl text-brand-navy">
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

              <Button
                type="submit"
                disabled={isSubmitting}
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

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl text-brand-navy">
              Get in touch
            </h2>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-brand-gold" />
                <span className="text-foreground">
                  {COMPANY.address.line1}
                  <br />
                  {COMPANY.address.city} {COMPANY.address.postcode}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-5 shrink-0 text-brand-gold" />
                <a
                  href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                  className={`rounded text-foreground hover:text-brand-navy ${FOCUS}`}
                >
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-5 shrink-0 text-brand-gold" />
                <a
                  href={`mailto:${COMPANY.email}`}
                  className={`rounded text-foreground hover:text-brand-navy ${FOCUS}`}
                >
                  {COMPANY.email}
                </a>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="size-5 shrink-0 text-brand-gold" />
              <h2 className="font-display text-xl text-brand-navy">
                Office hours
              </h2>
            </div>
            <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
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

          <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/[0.06] p-6">
            <p className="text-sm leading-relaxed text-foreground">
              {COMPANY.legalName}, company number {COMPANY.companyNumber},
              registered in {COMPANY.jurisdiction}.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
