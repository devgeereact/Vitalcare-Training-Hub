import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail, Phone, MapPin } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase/client"
import { COMPANY } from "@/lib/constants"

const contactSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
  organisation: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(10, "Tell us a little more (at least 10 characters)"),
})
type ContactValues = z.infer<typeof contactSchema>

const FOCUS =
  "focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [fallback, setFallback] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) })

  const onSubmit = async (values: ContactValues) => {
    setFallback(false)
    const { error } = await supabase.functions.invoke("contact-form", {
      body: values,
    })
    if (error) {
      // Edge function is deployed in Phase 7; until then, guide the user to email.
      console.error("[contact-form]", error)
      setFallback(true)
      return
    }
    setSent(true)
  }

  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title="Talk to the Vitalcare team"
        description="Tell us about your team and what you need. We will get back to you quickly."
      />

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          {sent ? (
            <Alert>
              <AlertDescription>
                Thank you. Your message has been sent and we will be in touch
                soon.
              </AlertDescription>
            </Alert>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="grid gap-5"
            >
              {fallback ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    We could not send your message just now. Please email us
                    directly at {COMPANY.email} or call {COMPANY.phone}.
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" className={FOCUS} aria-invalid={!!errors.name} {...register("name")} />
                {errors.name ? (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                ) : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    className={FOCUS}
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  {errors.email ? (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" className={FOCUS} {...register("phone")} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="organisation">Organisation (optional)</Label>
                <Input id="organisation" className={FOCUS} {...register("organisation")} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  rows={5}
                  className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none ${FOCUS}`}
                  aria-invalid={!!errors.message}
                  {...register("message")}
                />
                {errors.message ? (
                  <p className="text-sm text-destructive">{errors.message.message}</p>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto ${FOCUS}`}
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Send message"
                )}
              </Button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border p-6">
            <h2 className="font-semibold text-brand-navy">Get in touch</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-brand-gold" />
                <span>
                  {COMPANY.address.line1}
                  <br />
                  {COMPANY.address.city} {COMPANY.address.postcode}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 text-brand-gold" />
                {COMPANY.phone}
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 text-brand-gold" />
                {COMPANY.email}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
