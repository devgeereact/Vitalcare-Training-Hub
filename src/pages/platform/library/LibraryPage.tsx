import { useState } from "react"
import { toast } from "sonner"
import {
  FolderOpen,
  AlertCircle,
  Search,
  Plus,
  FileText,
  Video,
  LinkIcon,
  Presentation,
  Pencil,
  Trash2,
  Users,
  Loader2,
  ExternalLink,
  Download,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import MediaUpload from "@/components/courses/MediaUpload"
import { useUser } from "@/hooks/use-user"
import { useCourses } from "@/lib/queries/courses.queries"
import { useLearners } from "@/lib/queries/learners.queries"
import {
  useMyResources,
  useAllResources,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useAllocations,
  useSetAllocations,
  type CourseResource,
  type ResourceAudience,
  type ResourceKind,
  type ResourceInput,
} from "@/lib/queries/library.queries"

const KIND_ICON: Record<ResourceKind, typeof FileText> = {
  document: FileText,
  video: Video,
  link: LinkIcon,
  slide: Presentation,
}

const AUDIENCE_LABEL: Record<ResourceAudience, string> = {
  learner: "Learners",
  trainer: "Trainers",
  both: "Everyone",
}

const EMPTY: ResourceInput = {
  courseId: null,
  title: "",
  description: "",
  fileUrl: "",
  linkUrl: "",
  kind: "document",
  audience: "both",
  isPublished: true,
}

// ─── Reader card (learners + trainers) ────────────────────────────────────────
function ResourceTile({ r }: { r: CourseResource }) {
  const Icon = KIND_ICON[r.kind]
  const href = r.linkUrl || r.fileUrl
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-navy/5 text-brand-navy">
            <Icon className="size-4" />
          </span>
          <CardTitle className="text-base leading-snug">{r.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {r.courseTitle && (
          <Badge variant="secondary" className="w-fit font-normal">
            {r.courseTitle}
          </Badge>
        )}
        {r.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{r.description}</p>
        )}
        {href && (
          <Button asChild variant="outline" size="sm" className="mt-auto w-fit">
            <a href={href} target="_blank" rel="noopener noreferrer">
              {r.linkUrl ? (
                <>
                  <ExternalLink className="mr-1.5 size-3.5" /> Open
                </>
              ) : (
                <>
                  <Download className="mr-1.5 size-3.5" /> Download
                </>
              )}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Allocation dialog (admins target specific learners) ──────────────────────
// The inner form mounts only once the saved allocations have loaded, so its
// selection state can be seeded lazily from props without a setState effect.
function AllocateForm({
  resource,
  initialSelected,
  onOpenChange,
}: {
  resource: CourseResource
  initialSelected: string[]
  onOpenChange: (o: boolean) => void
}) {
  const learners = useLearners()
  const setAllocations = useSetAllocations()
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected))
  const [q, setQ] = useState("")

  const filtered = (learners.data ?? []).filter((l) =>
    l.name.toLowerCase().includes(q.toLowerCase()),
  )

  function toggle(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function save(): void {
    setAllocations
      .mutateAsync({ resourceId: resource.id, learnerIds: [...selected] })
      .then(() => {
        toast.success("Allocation saved")
        onOpenChange(false)
      })
      .catch(() => toast.error("Could not save allocation"))
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Allocate resource</DialogTitle>
        <DialogDescription>
          Target specific learners for {resource.title}. Leave everyone
          unticked to share with all who match the audience.
        </DialogDescription>
      </DialogHeader>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search learners…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      {learners.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No learners found.
        </p>
      ) : (
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {filtered.map((l) => (
            <label
              key={l.id}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
            >
              <Checkbox
                checked={selected.has(l.id)}
                onCheckedChange={() => toggle(l.id)}
              />
              <span className="text-sm">{l.name}</span>
            </label>
          ))}
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={save} disabled={setAllocations.isPending}>
          {setAllocations.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save allocation
        </Button>
      </DialogFooter>
    </>
  )
}

function AllocateDialog({
  resource,
  open,
  onOpenChange,
}: {
  resource: CourseResource | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const allocations = useAllocations(open ? resource?.id ?? null : null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        {!resource || allocations.isLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <AllocateForm
            // Remount per resource so the seeded selection stays correct.
            key={resource.id}
            resource={resource}
            initialSelected={(allocations.data ?? []).map((a) => a.learnerId)}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Resource editor dialog (admins create / edit) ────────────────────────────
function ResourceForm({
  resource,
  onOpenChange,
}: {
  resource: CourseResource | null
  onOpenChange: (o: boolean) => void
}) {
  const courses = useCourses()
  const create = useCreateResource()
  const update = useUpdateResource()
  const [values, setValues] = useState<ResourceInput>(() =>
    resource
      ? {
          courseId: resource.courseId,
          title: resource.title,
          description: resource.description ?? "",
          fileUrl: resource.fileUrl ?? "",
          linkUrl: resource.linkUrl ?? "",
          kind: resource.kind,
          audience: resource.audience,
          isPublished: resource.isPublished,
        }
      : EMPTY,
  )

  function set<K extends keyof ResourceInput>(key: K, val: ResourceInput[K]): void {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  function save(): void {
    if (!values.title.trim()) {
      toast.error("Give the resource a title.")
      return
    }
    const op = resource
      ? update.mutateAsync({ id: resource.id, values })
      : create.mutateAsync(values)
    op
      .then(() => {
        toast.success(resource ? "Resource updated" : "Resource added")
        onOpenChange(false)
      })
      .catch(() => toast.error("Could not save resource"))
  }

  const saving = create.isPending || update.isPending

  return (
    <>
        <DialogHeader>
          <DialogTitle>{resource ? "Edit resource" : "Add resource"}</DialogTitle>
          <DialogDescription>
            Course material for learners and trainers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-xs">Title</Label>
            <Input
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Moving and Handling handbook"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Description</Label>
            <Textarea
              rows={2}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What is this and how to use it"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">Course</Label>
              <Select
                value={values.courseId ?? "none"}
                onValueChange={(v) => set("courseId", v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General</SelectItem>
                  {(courses.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Type</Label>
              <Select
                value={values.kind}
                onValueChange={(v) => set("kind", v as ResourceKind)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="slide">Slides</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Audience</Label>
            <Select
              value={values.audience}
              onValueChange={(v) => set("audience", v as ResourceAudience)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="learner">Learners only</SelectItem>
                <SelectItem value="trainer">Trainers only</SelectItem>
                <SelectItem value="both">Everyone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {values.kind === "link" ? (
            <div>
              <Label className="mb-1.5 block text-xs">Link URL</Label>
              <Input
                value={values.linkUrl}
                onChange={(e) => set("linkUrl", e.target.value)}
                placeholder="https://"
              />
            </div>
          ) : (
            <div>
              <Label className="mb-1.5 block text-xs">File</Label>
              <MediaUpload
                value={values.fileUrl}
                onChange={(url) => set("fileUrl", url)}
                variant="file"
                accept="*/*"
                folder="library"
              />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Switch
              checked={values.isPublished}
              onCheckedChange={(v) => set("isPublished", v)}
            />
            <div>
              <Label>Published</Label>
              <p className="text-xs text-muted-foreground">Visible to the audience</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {resource ? "Save changes" : "Add resource"}
          </Button>
        </DialogFooter>
    </>
  )
}

function ResourceDialog({
  resource,
  open,
  onOpenChange,
}: {
  resource: CourseResource | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        {open && (
          // Remount per resource (or "new") so form state seeds correctly.
          <ResourceForm
            key={resource?.id ?? "new"}
            resource={resource}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Admin manage view ────────────────────────────────────────────────────────
function ManageLibrary() {
  const { data, isLoading, isError, refetch } = useAllResources()
  const del = useDeleteResource()
  const [q, setQ] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [allocateOpen, setAllocateOpen] = useState(false)
  const [active, setActive] = useState<CourseResource | null>(null)

  const filtered = (data ?? []).filter(
    (r) =>
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      (r.courseTitle ?? "").toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Resource library</h1>
          <p className="mt-1 text-muted-foreground">
            Add course materials and allocate which learners and trainers see them.
          </p>
        </div>
        <Button
          onClick={() => {
            setActive(null)
            setEditorOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" /> Add resource
        </Button>
      </div>

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load the library. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FolderOpen className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No resources yet. Add your first course material.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setActive(null)
                setEditorOpen(true)
              }}
            >
              Add resource
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No resources match “{q}”.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const Icon = KIND_ICON[r.kind]
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-navy/5 text-brand-navy">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.courseTitle ? `${r.courseTitle} · ` : ""}
                      {AUDIENCE_LABEL[r.audience]}
                      {!r.isPublished ? " · Draft" : ""}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-normal">
                    {AUDIENCE_LABEL[r.audience]}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Allocate"
                      onClick={() => {
                        setActive(r)
                        setAllocateOpen(true)
                      }}
                    >
                      <Users className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Edit"
                      onClick={() => {
                        setActive(r)
                        setEditorOpen(true)
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      aria-label="Delete"
                      onClick={() =>
                        del
                          .mutateAsync(r.id)
                          .then(() => toast.success("Resource removed"))
                          .catch(() => toast.error("Could not remove resource"))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ResourceDialog resource={active} open={editorOpen} onOpenChange={setEditorOpen} />
      <AllocateDialog resource={active} open={allocateOpen} onOpenChange={setAllocateOpen} />
    </div>
  )
}

// ─── Reader view (learners + trainers) ────────────────────────────────────────
function ReadLibrary({ audience }: { audience: "learner" | "trainer" }) {
  const { data, isLoading, isError, refetch } = useMyResources(audience)
  const [q, setQ] = useState("")
  const filtered = (data ?? []).filter(
    (r) =>
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      (r.courseTitle ?? "").toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Resource library</h1>
        <p className="mt-1 text-muted-foreground">
          {audience === "trainer"
            ? "Teaching materials and guides shared with you."
            : "Course materials and study aids shared with you."}
        </p>
      </div>

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load the library. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FolderOpen className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No resources shared with you yet.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No resources match “{q}”.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ResourceTile key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function LibraryPage() {
  const { isAdmin, isTrainer } = useUser()
  if (isAdmin) return <ManageLibrary />
  return <ReadLibrary audience={isTrainer ? "trainer" : "learner"} />
}
