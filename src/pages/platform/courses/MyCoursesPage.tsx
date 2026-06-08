import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  BookOpen,
  AlertCircle,
  ShieldCheck,
  LayoutGrid,
  List as ListIcon,
  Table as TableIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Link as RLink } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data-table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Clock, Award, ShieldCheck as ShieldIcon, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { driveImageUrl } from "@/lib/drive-image"
import { sanitizeHtml } from "@/lib/sanitize"
import {
  useMyCourses,
  useEnrolSelf,
  useCategoryNameMap,
  useCourses,
  useEnrolmentCounts,
} from "@/lib/queries/courses.queries"
import { CourseCard } from "@/components/courses/CourseCard"
import { courseColumns } from "./columns"
import { useUser } from "@/hooks/use-user"
import type { Course } from "@/types/database.types"

interface CardData {
  course: Course
  enrolled: boolean
  progressPct: number
}

type StaffView = "catalogue" | "manage"

/**
 * Unified, role-aware Courses page served at /platform/courses.
 *
 * - Learners: browse the catalogue, enrol, and track their progress.
 * - Trainers / admins: the same catalogue plus a "Manage" table view and a
 *   "New course" action. The catalogue here surfaces every published course;
 *   the manage table surfaces all courses including drafts.
 *
 * CoursesManagePage re-exports this component so the legacy
 * /platform/courses/manage route resolves to the same unified surface.
 */
interface CoursesPageProps {
  /** Initial staff view. The legacy /courses/manage route opens on "manage". */
  initialStaffView?: StaffView
}

export default function MyCoursesPage({ initialStaffView = "catalogue" }: CoursesPageProps = {}) {
  const { isAdmin, isTrainer, isContentEditor } = useUser()
  const canManage = isAdmin || isTrainer || isContentEditor

  const { data, isLoading, isError, refetch } = useMyCourses()
  const manage = useCourses()
  const enrol = useEnrolSelf()
  const categoryNames = useCategoryNameMap()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [staffView, setStaffView] = useState<StaffView>(initialStaffView)
  const [selected, setSelected] = useState<CardData | null>(null)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<
    "recommended" | "recent" | "title_az" | "title_za" | "cpd"
  >("recommended")
  const [category, setCategory] = useState<string>("all")
  const enrolmentCounts = useEnrolmentCounts()
  const [page, setPage] = useState(0)
  const PER_PAGE = 12

  // Categories present in the catalogue, for the filter dropdown.
  const categoryOptions = useMemo(() => {
    const ids = new Set<string>()
    for (const c of data ?? []) if (c.course.category_id) ids.add(c.course.category_id)
    return [...ids]
      .map((id) => ({ id, name: categoryNames.get(id) ?? "Uncategorised" }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data, categoryNames])

  const filtered = (data ?? [])
    .filter((c) => c.course.title.toLowerCase().includes(query.toLowerCase()))
    .filter((c) => category === "all" || c.course.category_id === category)
    .sort((a, b) => {
      switch (sort) {
        case "title_az":
          return a.course.title.localeCompare(b.course.title)
        case "title_za":
          return b.course.title.localeCompare(a.course.title)
        case "cpd":
          return b.course.cpd_hours - a.course.cpd_hours
        case "recommended": {
          // Most enrolled first; fall back to newest on a tie.
          const ca = enrolmentCounts.data?.get(a.course.id) ?? 0
          const cb = enrolmentCounts.data?.get(b.course.id) ?? 0
          if (cb !== ca) return cb - ca
          return (
            new Date(b.course.created_at).getTime() -
            new Date(a.course.created_at).getTime()
          )
        }
        case "recent":
        default:
          return (
            new Date(b.course.created_at).getTime() -
            new Date(a.course.created_at).getTime()
          )
      }
    })
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, pageCount - 1)
  const paged = filtered.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE)

  const showManageTable = canManage && staffView === "manage"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Courses</h1>
          <p className="mt-1 text-muted-foreground">
            {canManage
              ? "Browse the catalogue, manage your training content, and track learner progress."
              : "Browse the catalogue and continue your learning."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <div className="flex rounded-lg border border-border p-0.5">
              {(
                [
                  ["catalogue", "Catalogue"],
                  ["manage", "Manage"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={staffView === v}
                  onClick={() => setStaffView(v)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                    staffView === v
                      ? "bg-brand-navy text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {!showManageTable && (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setPage(0)
                  }}
                  className="w-44 pl-9 sm:w-56"
                />
              </div>
              <Select
                value={sort}
                onValueChange={(v) => {
                  setSort(v as typeof sort)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Most recommended</SelectItem>
                  <SelectItem value="recent">Most recent</SelectItem>
                  <SelectItem value="title_az">Title A to Z</SelectItem>
                  <SelectItem value="title_za">Title Z to A</SelectItem>
                  <SelectItem value="cpd">Most CPD hours</SelectItem>
                </SelectContent>
              </Select>
              {categoryOptions.length > 0 && (
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex rounded-lg border border-border p-0.5">
                {(
                  [
                    ["grid", LayoutGrid],
                    ["list", ListIcon],
                  ] as const
                ).map(([v, Icon]) => (
                  <button
                    key={v}
                    type="button"
                    aria-label={`${v} view`}
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                      view === v
                        ? "bg-brand-navy text-white"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            </>
          )}

          {canManage && (
            <Button asChild>
              <Link to="/platform/courses/builder">
                <Plus className="mr-2 size-4" /> New course
              </Link>
            </Button>
          )}
        </div>
      </div>

      {showManageTable ? (
        <Card>
          <CardContent className="p-5">
            {manage.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-64" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : manage.isError ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertCircle className="size-8 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  Could not load courses. Please try again.
                </p>
                <Button variant="outline" size="sm" onClick={() => manage.refetch()}>
                  Retry
                </Button>
              </div>
            ) : (manage.data?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <TableIcon className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No courses yet. Build your first course.
                </p>
                <Button asChild size="sm">
                  <Link to="/platform/courses/builder">New course</Link>
                </Button>
              </div>
            ) : (
              <DataTable columns={courseColumns} data={manage.data!} />
            )}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Could not load courses.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <BookOpen className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "No published courses yet. Build and publish a course to fill the catalogue."
              : "No published courses yet."}
          </p>
          {canManage && (
            <Button asChild size="sm">
              <Link to="/platform/courses/builder">New course</Link>
            </Button>
          )}
        </div>
      ) : view === "list" ? (
        <div className="space-y-3">
          {paged.map(({ course, enrolled, progressPct }) => (
            <Card key={course.id}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {course.thumbnail_url ? (
                    <img
                      src={driveImageUrl(course.thumbnail_url, 600)}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <BookOpen className="size-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{course.title}</p>
                    {course.is_cstf_aligned && (
                      <Badge variant="outline" className="gap-1 text-success">
                        <ShieldCheck className="size-3" /> CSTF
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {course.summary || "No summary provided."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {course.cpd_hours} CPD hours
                    {enrolled ? ` · ${progressPct}% complete` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected({ course, enrolled, progressPct })}
                  >
                    View
                  </Button>
                  {canManage && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/platform/courses/builder/${course.id}`}>Edit</Link>
                    </Button>
                  )}
                  {enrolled && (
                    <Button asChild size="sm">
                      <Link to={`/platform/courses/${course.id}`}>Continue</Link>
                    </Button>
                  )}
                  {!enrolled && !canManage && (
                    <Button
                      size="sm"
                      disabled={enrol.isPending}
                      onClick={() =>
                        enrol
                          .mutateAsync(course.id)
                          .then(() => toast.success("Enrolled"))
                          .catch(() => toast.error("Could not enrol"))
                      }
                    >
                      Enrol
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paged.map(({ course, enrolled, progressPct }) => (
            <div key={course.id} className="flex flex-col">
              <CourseCard
                title={course.title}
                onView={() => setSelected({ course, enrolled, progressPct })}
                categoryName={
                  course.category_id
                    ? categoryNames.get(course.category_id) ?? null
                    : null
                }
                cpdHours={course.cpd_hours}
                durationMins={course.duration_mins}
                cstf={course.is_cstf_aligned}
                thumbnailUrl={course.thumbnail_url}
                enrolled={enrolled}
                ctaLabel={enrolled ? "Continue" : "View course"}
              />
              {enrolled && (
                <div className="mt-2 px-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-gold"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {progressPct}% complete
                  </p>
                </div>
              )}
              {canManage && (
                <div className="mt-2 px-1">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to={`/platform/courses/builder/${course.id}`}>Edit course</Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!showManageTable &&
        !isLoading &&
        !isError &&
        filtered.length === 0 &&
        (data?.length ?? 0) > 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No courses match “{query}”.
          </p>
        )}

      {!showManageTable && pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {safePage + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Course detail popup */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              {selected.course.thumbnail_url && (
                <img
                  src={driveImageUrl(selected.course.thumbnail_url, 1200)}
                  alt={selected.course.title}
                  className="-mx-6 -mt-6 mb-2 aspect-[21/9] w-[calc(100%+3rem)] object-cover"
                />
              )}
              <DialogHeader>
                {selected.course.category_id &&
                  categoryNames.get(selected.course.category_id) && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
                      {categoryNames.get(selected.course.category_id)}
                    </p>
                  )}
                <DialogTitle className="font-display text-2xl">
                  {selected.course.title}
                </DialogTitle>
                {selected.course.summary && (
                  <DialogDescription>{selected.course.summary}</DialogDescription>
                )}
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                {selected.course.is_cstf_aligned && (
                  <Badge variant="outline" className="gap-1 text-success">
                    <ShieldIcon className="size-3" /> CSTF aligned
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Award className="size-3" /> {selected.course.cpd_hours} CPD hours
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="size-3" /> {selected.course.duration_mins} mins
                </Badge>
              </div>

              {selected.course.description && (
                <div
                  className="prose prose-sm mt-1 max-w-none text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selected.course.description) }}
                />
              )}

              {selected.enrolled && (
                <div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${selected.progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selected.progressPct}% complete
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2">
                {canManage && (
                  <Button asChild variant="outline">
                    <RLink to={`/platform/courses/builder/${selected.course.id}`}>
                      Edit course
                    </RLink>
                  </Button>
                )}
                {selected.enrolled ? (
                  <Button asChild>
                    <RLink to={`/platform/courses/${selected.course.id}`}>
                      <PlayCircle className="mr-2 size-4" /> Continue
                    </RLink>
                  </Button>
                ) : (
                  <Button asChild>
                    <RLink to={`/platform/courses/${selected.course.id}`}>
                      {canManage ? "Open course" : "View course"}
                    </RLink>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
