import { useRef, useState } from "react"
import { toast } from "sonner"
import { Upload, FileText, Loader2, Check, ListTree } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { parseImportFile, type ParsedModule } from "@/lib/courses/parse-import"
import { useImportCurriculum } from "@/lib/queries/courses.queries"

export default function ImportCurriculumDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedModule[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const importMut = useImportCurriculum(courseId)

  async function onFile(file: File) {
    setParsing(true)
    setParsed(null)
    try {
      const mods = await parseImportFile(file)
      if (mods.length === 0) {
        toast.error("Nothing detected", {
          description: "Use # for modules and ## for lessons (or Heading 1/2 in Word).",
        })
      } else {
        setParsed(mods)
      }
    } catch (err) {
      console.error("[import parse]", err)
      toast.error("Could not read that file")
    } finally {
      setParsing(false)
    }
  }

  function confirm() {
    if (!parsed) return
    importMut
      .mutateAsync(parsed)
      .then((r) => {
        toast.success(`Imported ${r.modules} modules, ${r.lessons} lessons`)
        setParsed(null)
        setOpen(false)
      })
      .catch(() => toast.error("Import failed"))
  }

  const lessonCount = (parsed ?? []).reduce((n, m) => n + m.lessons.length, 0)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setParsed(null)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 size-4" /> Import from file
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import curriculum</DialogTitle>
          <DialogDescription>
            Upload a Word (.docx), Markdown (.md), text (.txt) or LearnPress /
            WordPress export (.xml) file. In documents, Heading 1 (or “# ”)
            becomes a module and Heading 2 (or “## ”) a lesson. An .xml export
            auto-links its lessons into this course.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".docx,.md,.txt,.markdown,.xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ""
          }}
        />

        {!parsed ? (
          <Button
            variant="outline"
            className="h-24 w-full border-dashed"
            disabled={parsing}
            onClick={() => inputRef.current?.click()}
          >
            {parsing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileText className="mr-2 size-4" />
            )}
            {parsing ? "Reading…" : "Choose a file"}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <ListTree className="size-4 text-brand-navy" />
              {parsed.length} modules · {lessonCount} lessons detected
            </p>
            <ul className="space-y-2 rounded-lg border border-border p-3">
              {parsed.map((m, i) => (
                <li key={i}>
                  <p className="text-sm font-medium">
                    {i + 1}. {m.title}
                  </p>
                  <ul className="ml-4 list-disc text-sm text-muted-foreground">
                    {m.lessons.map((l, j) => (
                      <li key={j} className="truncate">
                        {l.title}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          {parsed && (
            <Button variant="outline" onClick={() => setParsed(null)}>
              Choose another
            </Button>
          )}
          <Button
            onClick={confirm}
            disabled={!parsed || importMut.isPending}
          >
            {importMut.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Check className="mr-2 size-4" />
            )}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
