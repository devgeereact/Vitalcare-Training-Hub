import { useState, type ReactNode } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import {
  useCreateLearners,
  type CreateLearnersResult,
} from "@/lib/queries/learners.queries"
import {
  getProfileIdByEmail,
  useUserMutations,
} from "@/lib/queries/users.queries"
import type { UserRole } from "@/types/database.types"

/** Roles an admin may assign when creating an account (no super_admin). */
const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "learner", label: "Learner" },
  { value: "trainer", label: "Trainer" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "content_editor", label: "Content editor" },
]

const newAccountSchema = z.object({
  first_name: z.string().trim().min(2, "Enter a first name"),
  last_name: z.string().trim().min(2, "Enter a last name"),
  email: z.string().trim().min(1, "Enter an email").email("Enter a valid email"),
  role: z.enum(["learner", "trainer", "admin", "manager", "content_editor"]),
})

type NewAccountValues = z.infer<typeof newAccountSchema>

export default function NewAccountDialog({
  children,
}: {
  children: ReactNode
}): ReactNode {
  const [open, setOpen] = useState(false)
  const createLearners = useCreateLearners()
  const { setRole } = useUserMutations()

  const form = useForm<NewAccountValues>({
    resolver: zodResolver(newAccountSchema),
    defaultValues: { first_name: "", last_name: "", email: "", role: "learner" },
  })

  const submitting = createLearners.isPending || setRole.isPending

  async function onSubmit(values: NewAccountValues): Promise<void> {
    try {
      // The Edge Function creates the auth user + profile (role defaults to learner).
      const result: CreateLearnersResult = await createLearners.mutateAsync([
        {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          phone: "",
        },
      ])

      if (result.created < 1) {
        const msg = result.errors[0]?.error ?? "Could not create account"
        toast.error("Not created", { description: msg })
        return
      }

      // If the admin chose a role other than learner, patch the new profile.
      if (values.role !== "learner") {
        const id = await getProfileIdByEmail(values.email)
        if (!id) {
          toast.warning("Account created, role not set", {
            description:
              "The account was created as a learner. Open it from the list to change the role.",
          })
        } else {
          await setRole.mutateAsync({ id, role: values.role })
        }
      }

      toast.success("Account created", {
        description: `${values.email} can set a password via the forgot-password flow.`,
      })
      form.reset({ first_name: "", last_name: "", email: "", role: "learner" })
      setOpen(false)
    } catch (err) {
      toast.error("Not created", {
        description: err instanceof Error ? err.message : "Unexpected error",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) form.reset({ first_name: "", last_name: "", email: "", role: "learner" })
      }}
    >
      <div onClick={() => setOpen(true)}>{children}</div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New account</DialogTitle>
          <DialogDescription>
            Create an account and choose a role. The person sets their password
            through the forgot-password flow.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jordan"
                        autoComplete="given-name"
                        {...field}
                      />
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
                      <Input
                        placeholder="Reyes"
                        autoComplete="family-name"
                        {...field}
                      />
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
                    <Input
                      type="email"
                      placeholder="jordan@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
