import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import {
  learnerCreateSchema,
  type LearnerCreateValues,
} from "@/lib/validations/learner.schema"
import { useCreateLearners } from "@/lib/queries/learners.queries"

export default function LearnerNewPage() {
  const navigate = useNavigate()
  const createLearners = useCreateLearners()

  const form = useForm<LearnerCreateValues>({
    resolver: zodResolver(learnerCreateSchema),
    defaultValues: { first_name: "", last_name: "", email: "", phone: "" },
  })

  async function onSubmit(values: LearnerCreateValues) {
    try {
      const result = await createLearners.mutateAsync([values])
      if (result.created > 0) {
        toast.success("Learner added", {
          description: `${values.email} can now set a password via the forgot-password flow.`,
        })
        navigate("/platform/learners")
      } else {
        const msg = result.errors[0]?.error ?? "Could not create learner"
        toast.error("Not added", { description: msg })
      }
    } catch (err) {
      toast.error("Not added", {
        description: err instanceof Error ? err.message : "Unexpected error",
      })
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/platform/learners">
          <ArrowLeft className="mr-1.5 size-4" /> Back to learners
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Add a learner</CardTitle>
          <CardDescription>
            Creates an account and invites them to set a password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="Harni" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Muharami" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="learner@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="020 8059 8757" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button asChild variant="outline" type="button">
                  <Link to="/platform/learners">Cancel</Link>
                </Button>
                <Button type="submit" disabled={createLearners.isPending}>
                  {createLearners.isPending ? "Adding…" : "Add learner"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
