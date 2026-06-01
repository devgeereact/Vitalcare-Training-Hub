import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, AlertCircle } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Skeleton } from "@/components/ui/skeleton"

import {
  learnerEditSchema,
  type LearnerEditValues,
} from "@/lib/validations/learner.schema"
import { useLearner, useUpdateLearner } from "@/lib/queries/learners.queries"

export default function LearnerEditPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const learner = useLearner(id)
  const update = useUpdateLearner(id)

  const form = useForm<LearnerEditValues>({
    resolver: zodResolver(learnerEditSchema),
    defaultValues: { first_name: "", last_name: "", phone: "" },
  })

  useEffect(() => {
    if (learner.data) {
      form.reset({
        first_name: learner.data.first_name ?? "",
        last_name: learner.data.last_name ?? "",
        phone: learner.data.phone ?? "",
      })
    }
  }, [learner.data, form])

  async function onSubmit(values: LearnerEditValues) {
    try {
      await update.mutateAsync(values)
      toast.success("Learner updated")
      navigate(`/platform/learners/${id}`)
    } catch {
      toast.error("Could not save changes")
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to={`/platform/learners/${id}`}>
          <ArrowLeft className="mr-1.5 size-4" /> Back to profile
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Edit learner</CardTitle>
        </CardHeader>
        <CardContent>
          {learner.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : learner.isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load this learner.
              </p>
              <Button variant="outline" size="sm" onClick={() => learner.refetch()}>
                Retry
              </Button>
            </div>
          ) : (
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
                          <Input {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button asChild variant="outline" type="button">
                    <Link to={`/platform/learners/${id}`}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={update.isPending}>
                    {update.isPending ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
