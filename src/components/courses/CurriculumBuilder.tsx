import { useState } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Trash2, Pencil, FileText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  useCurriculum,
  useCurriculumMutations,
  type CurriculumModule,
} from "@/lib/queries/courses.queries"
import type { Lesson } from "@/types/database.types"
import type { LessonFormValues } from "@/lib/validations/course.schema"
import LessonDialog from "./LessonDialog"

function SortableRow({
  id,
  children,
}: {
  id: string
  children: (handle: React.ReactNode) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  const handle = (
    <button
      type="button"
      aria-label="Drag to reorder"
      className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  )
  return (
    <div ref={setNodeRef} style={style}>
      {children(handle)}
    </div>
  )
}

export default function CurriculumBuilder({ courseId }: { courseId: string }) {
  const { data: modules, isLoading, isError, refetch } = useCurriculum(courseId)
  const m = useCurriculumMutations(courseId)
  const [newModule, setNewModule] = useState("")
  const [lessonDialog, setLessonDialog] = useState<{
    moduleId: string
    lesson: Lesson | null
  } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onModuleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id || !modules) return
    const ids = modules.map((x) => x.id)
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    m.reorderModules.mutate(next)
  }

  function onLessonDragEnd(mod: CurriculumModule, e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = mod.lessons.map((l) => l.id)
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    m.reorderLessons.mutate(next)
  }

  function handleLessonSubmit(values: LessonFormValues) {
    if (!lessonDialog) return
    const mod = modules?.find((x) => x.id === lessonDialog.moduleId)
    const action = lessonDialog.lesson
      ? m.updateLesson.mutateAsync({ id: lessonDialog.lesson.id, values })
      : m.addLesson.mutateAsync({
          moduleId: lessonDialog.moduleId,
          values,
          position: mod?.lessons.length ?? 0,
        })
    action
      .then(() => {
        toast.success(lessonDialog.lesson ? "Lesson updated" : "Lesson added")
        setLessonDialog(null)
      })
      .catch(() => toast.error("Could not save lesson"))
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Could not load curriculum.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onModuleDragEnd}>
        <SortableContext
          items={(modules ?? []).map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {(modules ?? []).map((mod) => (
              <SortableRow key={mod.id} id={mod.id}>
                {(handle) => (
                  <div className="rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 border-b border-border p-3">
                      {handle}
                      <Input
                        defaultValue={mod.title}
                        className="h-8 max-w-sm font-medium"
                        onBlur={(e) => {
                          const v = e.target.value.trim()
                          if (v && v !== mod.title)
                            m.updateModule.mutate({ id: mod.id, title: v })
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto size-8 text-destructive"
                        aria-label="Delete module"
                        onClick={() => m.deleteModule.mutate(mod.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="p-3">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => onLessonDragEnd(mod, e)}
                      >
                        <SortableContext
                          items={mod.lessons.map((l) => l.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1.5">
                            {mod.lessons.length === 0 && (
                              <p className="py-2 text-sm text-muted-foreground">
                                No lessons yet.
                              </p>
                            )}
                            {mod.lessons.map((lesson) => (
                              <SortableRow key={lesson.id} id={lesson.id}>
                                {(lhandle) => (
                                  <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
                                    {lhandle}
                                    <FileText className="size-3.5 text-muted-foreground" />
                                    <span className="truncate text-sm">
                                      {lesson.title}
                                    </span>
                                    <Badge variant="outline" className="ml-1 text-[10px] capitalize">
                                      {lesson.type}
                                    </Badge>
                                    <div className="ml-auto flex gap-0.5">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        aria-label="Edit lesson"
                                        onClick={() =>
                                          setLessonDialog({ moduleId: mod.id, lesson })
                                        }
                                      >
                                        <Pencil className="size-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 text-destructive"
                                        aria-label="Delete lesson"
                                        onClick={() => m.deleteLesson.mutate(lesson.id)}
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </SortableRow>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => setLessonDialog({ moduleId: mod.id, lesson: null })}
                      >
                        <Plus className="mr-1.5 size-4" /> Add lesson
                      </Button>
                    </div>
                  </div>
                )}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add module */}
      <div className="flex gap-2">
        <Input
          placeholder="New module title"
          value={newModule}
          onChange={(e) => setNewModule(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newModule.trim()) {
              m.addModule.mutate({ title: newModule.trim(), position: modules?.length ?? 0 })
              setNewModule("")
            }
          }}
        />
        <Button
          variant="outline"
          disabled={!newModule.trim()}
          onClick={() => {
            m.addModule.mutate({ title: newModule.trim(), position: modules?.length ?? 0 })
            setNewModule("")
          }}
        >
          <Plus className="mr-1.5 size-4" /> Add module
        </Button>
      </div>

      <LessonDialog
        open={!!lessonDialog}
        onOpenChange={(v) => !v && setLessonDialog(null)}
        defaultValues={
          lessonDialog?.lesson
            ? {
                title: lessonDialog.lesson.title,
                type: lessonDialog.lesson.type,
                content: lessonDialog.lesson.content ?? "",
                video_url: lessonDialog.lesson.video_url ?? "",
                scorm_url: lessonDialog.lesson.scorm_url ?? "",
                document_url: lessonDialog.lesson.document_url ?? "",
                duration_mins: lessonDialog.lesson.duration_mins,
              }
            : undefined
        }
        onSubmit={handleLessonSubmit}
        saving={m.addLesson.isPending || m.updateLesson.isPending}
      />
    </div>
  )
}
