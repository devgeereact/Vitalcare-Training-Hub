import { useState } from "react"
import { toast } from "sonner"
import { FileText, Trash2, Plus, Download, Lock, Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import MediaUpload from "@/components/courses/MediaUpload"
import {
  useAllResources,
  useCreateResource,
  useDeleteResource,
  type ResourceAudience,
  type ResourceKind,
} from "@/lib/queries/library.queries"

const AUDIENCE_LABEL: Record<ResourceAudience, string> = {
  learner: "Learners only",
  trainer: "Trainers only",
  both: "Learners and trainers",
}

const KIND_OPTIONS: { value: ResourceKind; label: string; accept: string }[] = [
  { value: "document", label: "Document", accept: ".pdf,.doc,.docx,.ppt,.pptx" },
  { value: "slide", label: "Slides", accept: ".pdf,.ppt,.pptx" },
  { value: "video", label: "Video", accept: "video/*" },
  { value: "link", label: "Link", accept: "" },
]

export default function CourseMaterialsEditor({ courseId }: { courseId: string }) {
  const all = useAllResources()
  const create = useCreateResource()
  const remove = useDeleteResource()

  const [title, setTitle] = useState("")
  const [audience, setAudience] = useState<ResourceAudience>("learner")
  const [kind, setKind] = useState<ResourceKind>("document")
  const [fileUrl, setFileUrl] = useState("")
  const [linkUrl, setLinkUrl] = useState("")

  const materials = (all.data ?? []).filter((r) => r.courseId === courseId)
  const accept = KIND_OPTIONS.find((k) => k.value === kind)?.accept ?? ""

  function reset() {
    setTitle("")
    setAudience("learner")
    setKind("document")
    setFileUrl("")
    setLinkUrl("")
  }

  function add() {
    const hasSource = kind === "link" ? !!linkUrl.trim() : !!fileUrl.trim()
    if (!title.trim() || !hasSource) {
      toast.error("Add a title and a file or link")
      return
    }
    create
      .mutateAsync({
        courseId,
        title: title.trim(),
        description: "",
        fileUrl: kind === "link" ? "" : fileUrl,
        linkUrl: kind === "link" ? linkUrl : "",
        kind,
        audience,
        isPublished: true,
      })
      .then(() => {
        toast.success("Material added")
        reset()
      })
      .catch(() => toast.error("Could not add material"))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl">
          <FileText className="size-5 text-brand-navy" />
          Workbooks and materials
        </CardTitle>
        <CardDescription>
          Attach the Learner Workbook, Trainer Workbook, and any resources. Trainer
          materials are never visible to learners. Uploads are also saved to the
          admin Google Drive folder for review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Existing materials */}
        {all.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : all.isError ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">Could not load materials.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => all.refetch()}>
              Retry
            </Button>
          </div>
        ) : materials.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            No materials yet. Add the Learner and Trainer Workbooks below.
          </p>
        ) : (
          <ul className="space-y-2">
            {materials.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
              >
                {r.audience === "trainer" ? (
                  <Lock className="size-4 shrink-0 text-amber-600" />
                ) : (
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-sm font-medium">{r.title}</span>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {r.kind}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    r.audience === "trainer"
                      ? "text-[10px] border-amber-300 bg-amber-50 text-amber-700"
                      : "text-[10px]"
                  }
                >
                  {AUDIENCE_LABEL[r.audience]}
                </Badge>
                <div className="ml-auto flex items-center gap-1">
                  {(r.fileUrl || r.linkUrl) && (
                    <Button asChild variant="ghost" size="icon" className="size-8">
                      <a
                        href={r.fileUrl || r.linkUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open material"
                      >
                        <Download className="size-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    aria-label="Delete material"
                    onClick={() =>
                      remove
                        .mutateAsync(r.id)
                        .then(() => toast.success("Material removed"))
                        .catch(() => toast.error("Could not remove material"))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add material */}
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              placeholder="Material title (e.g. Learner Workbook)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={audience} onValueChange={(v) => setAudience(v as ResourceAudience)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learner">Learners only</SelectItem>
                  <SelectItem value="trainer">Trainers only</SelectItem>
                  <SelectItem value="both">Learners and trainers</SelectItem>
                </SelectContent>
              </Select>
              <Select value={kind} onValueChange={(v) => setKind(v as ResourceKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {kind === "link" ? (
            <Input
              placeholder="https://…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          ) : (
            <MediaUpload
              value={fileUrl}
              onChange={setFileUrl}
              variant="file"
              accept={accept}
              folder="materials"
              driveTarget="review"
            />
          )}

          <div className="flex justify-end">
            <Button onClick={add} disabled={create.isPending}>
              {create.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Plus className="mr-1.5 size-4" />
              )}
              Add material
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
