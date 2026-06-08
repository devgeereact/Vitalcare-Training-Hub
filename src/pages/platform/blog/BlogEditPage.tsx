import { useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, AlertCircle, Loader2, Save, Send } from "lucide-react"
import AuthoringHeader from "@/components/authoring/AuthoringHeader"
import AiFieldsButton from "@/components/ai/AiFieldsButton"
import AiAssistButton from "@/components/ai/AiAssistButton"
import MediaUpload from "@/components/courses/MediaUpload"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import {
  useAdminPost,
  useSavePost,
  slugify,
  type BlogPostInput,
} from "@/lib/queries/blog.queries"

const schema = z.object({
  title: z.string().min(3, "Enter a title"),
  slug: z
    .string()
    .min(3, "Enter a slug")
    .regex(/^[a-z0-9-]+$/, "Lower case letters, numbers and hyphens only"),
  excerpt: z.string().min(10, "Write a short summary"),
  body: z.string().min(10, "Write the article body"),
  feature_image_url: z.string().url("Enter a valid URL").or(z.literal("")),
})
type FormValues = z.infer<typeof schema>

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

export default function BlogEditPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === "new"
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const authorName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Vitalcare"

  const existing = useAdminPost(isNew ? undefined : id)
  const save = useSavePost(session?.user.id, authorName)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", slug: "", excerpt: "", body: "", feature_image_url: "" },
  })

  // Load the post into the form when editing.
  useEffect(() => {
    if (!isNew && existing.data) {
      reset({
        title: existing.data.title,
        slug: existing.data.slug,
        excerpt: existing.data.excerpt,
        body: existing.data.body,
        feature_image_url: existing.data.feature_image_url ?? "",
      })
    }
  }, [isNew, existing.data, reset])

  // Auto-fill the slug from the title until the slug is edited.
  const title = watch("title")
  const slug = watch("slug")
  useEffect(() => {
    if (isNew && (!slug || slug === slugify(title.slice(0, title.length - 1)))) {
      setValue("slug", slugify(title))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

  async function onSubmit(values: FormValues, status: "draft" | "published") {
    const input: BlogPostInput = {
      id: isNew ? undefined : id,
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt,
      body: values.body,
      feature_image_url: values.feature_image_url || null,
      status,
    }
    save.mutate(input, {
      onSuccess: () => {
        toast.success(status === "published" ? "Published" : "Saved as draft")
        navigate("/platform/blog")
      },
      onError: (e) =>
        toast.error("Could not save", {
          description: e instanceof Error ? e.message : "Super-admin only.",
        }),
    })
  }

  if (!isNew && existing.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!isNew && existing.isError) {
    return (
      <div className="">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Could not load this post. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => existing.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <AuthoringHeader />
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/platform/blog">
            <ArrowLeft className="mr-1.5 size-4" /> All posts
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              {isNew ? "New post" : "Edit post"}
            </CardTitle>
            <CardDescription>
              Write an article for the public blog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5">
        <div className="flex justify-end">
          <AiFieldsButton
            subject="a UK health and social care blog article"
            context={`Working title: ${watch("title") || "(none)"}`}
            fields={[
              { key: "title", label: "Title", format: "text" },
              { key: "excerpt", label: "Excerpt", format: "text" },
              { key: "body", label: "Body", format: "text" },
            ]}
            onApply={(v) => {
              if (v.title) setValue("title", v.title.slice(0, 160))
              if (v.excerpt) setValue("excerpt", v.excerpt)
              if (v.body) setValue("body", v.body)
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" className={FOCUS} {...register("title")} />
          {errors.title ? (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" className={`font-mono ${FOCUS}`} {...register("slug")} />
          <p className="text-xs text-muted-foreground">
            The article URL: /resources/blog/{slug || "your-slug"}
          </p>
          {errors.slug ? (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label>Feature image (optional)</Label>
          <MediaUpload
            value={watch("feature_image_url") ?? ""}
            onChange={(url) => setValue("feature_image_url", url)}
            variant="image"
            accept="image/*"
            folder="blog"
          />
          {errors.feature_image_url ? (
            <p className="text-sm text-destructive">
              {errors.feature_image_url.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea id="excerpt" rows={2} className={FOCUS} {...register("excerpt")} />
          {errors.excerpt ? (
            <p className="text-sm text-destructive">{errors.excerpt.message}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="body">Body</Label>
            <AiAssistButton
              task="a UK health and social care blog article body"
              context={`Title: ${watch("title")}\nExcerpt: ${watch("excerpt")}`}
              onInsert={(text) => setValue("body", text)}
            />
          </div>
          <Textarea
            id="body"
            rows={14}
            className={FOCUS}
            placeholder="Write the article. Leave a blank line between paragraphs."
            {...register("body")}
          />
          {errors.body ? (
            <p className="text-sm text-destructive">{errors.body.message}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={save.isPending}
            onClick={handleSubmit((v) => onSubmit(v, "draft"))}
          >
            {save.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save draft
          </Button>
          <Button
            type="button"
            disabled={save.isPending}
            onClick={handleSubmit((v) => onSubmit(v, "published"))}
          >
            {save.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            Publish
          </Button>
          {!isDirty && !isNew ? (
            <span className="self-center text-xs text-muted-foreground">
              No unsaved changes
            </span>
          ) : null}
            </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
