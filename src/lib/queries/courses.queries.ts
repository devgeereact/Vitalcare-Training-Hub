import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { issueCourseCertificate } from "@/lib/queries/certificates.queries"
import { callRpc } from "@/lib/supabase/rpc"
import { stripDashes } from "@/lib/text/strip-dashes"
import type {
  Course,
  CourseCategory,
  Lesson,
  Module,
  LessonType,
} from "@/types/database.types"
import type {
  CourseFormValues,
  LessonFormValues,
} from "@/lib/validations/course.schema"

export const coursesKeys = {
  all: ["courses"] as const,
  list: () => [...coursesKeys.all, "list"] as const,
  published: () => [...coursesKeys.all, "published"] as const,
  detail: (id: string) => [...coursesKeys.all, "detail", id] as const,
  curriculum: (id: string) => [...coursesKeys.all, "curriculum", id] as const,
  categories: () => ["course-categories"] as const,
  myEnrolments: () => [...coursesKeys.all, "my-enrolments"] as const,
}

// ─── Categories ─────────────────────────────────────────────────────────────
export async function getCategories(): Promise<CourseCategory[]> {
  const { data, error } = await supabase
    .from("course_categories")
    .select("*")
    .order("id", { ascending: true })
  if (error) {
    console.error("[getCategories]", error)
    throw error
  }
  return (data ?? []) as CourseCategory[]
}

export function useCategories() {
  return useQuery({
    queryKey: coursesKeys.categories(),
    queryFn: getCategories,
    staleTime: 30 * 60 * 1000,
  })
}

/** Global enrolment count per course, for the "Most recommended" sort.
 *  Backed by the SECURITY DEFINER function course_enrolment_counts (migration
 *  066), which returns aggregate counts only. */
export function useEnrolmentCounts() {
  return useQuery({
    queryKey: [...coursesKeys.all, "enrolment-counts"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Map<string, number>> => {
      const { data, error } =
        await callRpc<{ course_id: string; total: number }[]>("course_enrolment_counts")
      if (error) {
        console.error("[useEnrolmentCounts]", error)
        return new Map()
      }
      return new Map((data ?? []).map((r) => [r.course_id, Number(r.total)]))
    },
  })
}

/**
 * Map of category id -> category name, for resolving a course's category name
 * in card grids. Returns an empty map while loading.
 */
export function useCategoryNameMap(): Map<string, string> {
  const { data } = useCategories()
  return new Map((data ?? []).map((c) => [c.id, c.name]))
}

// ─── Course list ─────────────────────────────────────────────────────────────
export interface CourseRow {
  id: string
  title: string
  categoryName: string
  cstf: boolean
  cpdHours: number
  status: "Published" | "Draft"
  updatedAt: string
  thumbnailUrl: string | null
}

export async function getCourses(
  { archived = false }: { archived?: boolean } = {},
): Promise<CourseRow[]> {
  const base = supabase
    .from("courses")
    .select(
      "id, title, category_id, is_cstf_aligned, cpd_hours, is_published, updated_at, thumbnail_url",
    )
  const [courses, categories] = await Promise.all([
    (archived
      ? base.not("deleted_at", "is", null)
      : base.is("deleted_at", null)
    ).order("updated_at", { ascending: false }),
    getCategories(),
  ])
  if (courses.error) {
    console.error("[getCourses]", courses.error)
    throw courses.error
  }
  const catName = new Map(categories.map((c) => [c.id, c.name]))
  return (courses.data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    categoryName: c.category_id ? catName.get(c.category_id) ?? "-" : "-",
    cstf: c.is_cstf_aligned,
    cpdHours: c.cpd_hours,
    status: c.is_published ? "Published" : "Draft",
    updatedAt: c.updated_at,
    thumbnailUrl: c.thumbnail_url ?? null,
  }))
}

export function useCourses() {
  return useQuery({ queryKey: coursesKeys.list(), queryFn: () => getCourses() })
}

/** Courses that have been archived, so an administrator can restore one. */
export function useArchivedCourses(enabled = true) {
  return useQuery({
    queryKey: [...coursesKeys.all, "archived"],
    enabled,
    queryFn: () => getCourses({ archived: true }),
  })
}

// ─── Single course ───────────────────────────────────────────────────────────
export async function getCourse(id: string): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single()
  if (error) {
    console.error("[getCourse]", error)
    throw error
  }
  return data as Course
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: coursesKeys.detail(id),
    queryFn: () => getCourse(id),
    enabled: !!id,
  })
}

// ─── Curriculum (modules + lessons) ──────────────────────────────────────────
export interface CurriculumModule extends Module {
  lessons: Lesson[]
}

export async function getCurriculum(
  courseId: string,
): Promise<CurriculumModule[]> {
  const { data: modules, error } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .order("position", { ascending: true })
  if (error) {
    console.error("[getCurriculum]", error)
    throw error
  }
  if (!modules || modules.length === 0) return []

  const moduleIds = modules.map((m) => m.id)
  const { data: lessons, error: lErr } = await supabase
    .from("lessons")
    .select("*")
    .in("module_id", moduleIds)
    .is("deleted_at", null)
    .order("position", { ascending: true })
  if (lErr) console.error("[getCurriculum:lessons]", lErr)

  return (modules as Module[]).map((m) => ({
    ...m,
    lessons: ((lessons ?? []) as Lesson[]).filter((l) => l.module_id === m.id),
  }))
}

export function useCurriculum(courseId: string) {
  return useQuery({
    queryKey: coursesKeys.curriculum(courseId),
    queryFn: () => getCurriculum(courseId),
    enabled: !!courseId,
  })
}

// ─── Course mutations ────────────────────────────────────────────────────────
function toCourseRow(values: CourseFormValues) {
  return {
    title: stripDashes(values.title),
    summary: values.summary ? stripDashes(values.summary) : null,
    description: values.description ? stripDashes(values.description) : null,
    category_id: values.category_id,
    is_cstf_aligned: values.is_cstf_aligned,
    cpd_hours: values.cpd_hours,
    duration_mins: values.duration_mins,
    is_published: values.is_published,
    thumbnail_url: values.thumbnail_url || null,
  }
}

export function useCreateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: CourseFormValues): Promise<string> => {
      const { data: auth } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("courses")
        .insert({ ...toCourseRow(values), created_by: auth.user?.id ?? null })
        .select("id")
        .single()
      if (error) {
        console.error("[useCreateCourse]", error)
        throw error
      }
      return data.id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: coursesKeys.list() }),
  })
}

export function useUpdateCourse(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const { error } = await supabase
        .from("courses")
        .update(toCourseRow(values))
        .eq("id", id)
      if (error) {
        console.error("[useUpdateCourse]", error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coursesKeys.detail(id) })
      qc.invalidateQueries({ queryKey: coursesKeys.list() })
    },
  })
}

/**
 * What a course is entangled with. Read before offering to remove it, so the
 * administrator is told exactly what happens rather than asked to guess.
 */
export interface CourseDeletionImpact {
  enrolments: number
  certificates: number
  assessments: number
  orders: number
  sessions: number
  resources: number
  /** True only when the course has no learner records at all. */
  canHardDelete: boolean
}

interface ImpactRow {
  enrolments: number
  certificates: number
  assessments: number
  orders: number
  sessions: number
  resources: number
  can_hard_delete: boolean
}

export function useCourseDeletionImpact(id: string | null) {
  return useQuery({
    queryKey: [...coursesKeys.all, "deletion-impact", id ?? "none"],
    enabled: !!id,
    staleTime: 0,
    queryFn: async (): Promise<CourseDeletionImpact> => {
      const { data, error } = await callRpc<ImpactRow[]>("course_deletion_impact", {
        p_course: id!,
      })
      if (error) {
        console.error("[useCourseDeletionImpact]", error)
        throw error
      }
      const row = data?.[0]
      if (!row) throw new Error("No impact returned")
      return {
        enrolments: Number(row.enrolments),
        certificates: Number(row.certificates),
        assessments: Number(row.assessments),
        orders: Number(row.orders),
        sessions: Number(row.sessions),
        resources: Number(row.resources),
        canHardDelete: Boolean(row.can_hard_delete),
      }
    },
  })
}

/**
 * Withdraw a course from the catalogue, keeping every learner record intact.
 *
 * This is the right default for regulated training: certificates, assessment
 * results and invoices all point at the course, and a certificate whose course
 * has vanished is not evidence of anything. The server checks the caller is an
 * administrator, unpublishes the linked assessments, and writes an audit entry.
 */
export function useArchiveCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await callRpc<boolean>("archive_course", { p_course: id })
      if (error) {
        console.error("[useArchiveCourse]", error)
        throw new Error(error.message)
      }
      return data === true
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: coursesKeys.all }),
  })
}

/** Put an archived course back, as a draft. */
export function useRestoreCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await callRpc<boolean>("restore_course", { p_course: id })
      if (error) {
        console.error("[useRestoreCourse]", error)
        throw new Error(error.message)
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: coursesKeys.all }),
  })
}

/**
 * Permanently remove a course and its curriculum.
 *
 * The server refuses unless the course has no enrolments, certificates, orders
 * or sessions, so this can only ever remove something nobody has used. It is
 * the escape hatch for a course created by mistake, not a tidy-up tool.
 */
export function useDeleteCoursePermanently() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await callRpc<boolean>("delete_course_permanently", {
        p_course: id,
      })
      if (error) {
        console.error("[useDeleteCoursePermanently]", error)
        throw new Error(error.message)
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: coursesKeys.all }),
  })
}

// ─── Module / lesson mutations ───────────────────────────────────────────────
export interface ImportModule {
  title: string
  lessons: { title: string; content: string }[]
}

/**
 * Clone a course into a new unpublished draft: copies the course fields, the
 * full curriculum (modules + lessons), FAQs and prerequisites. Returns the new
 * course id so the caller can open the builder on it.
 */
export function useDuplicateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sourceId: string): Promise<string> => {
      const { data: src, error: srcErr } = await supabase
        .from("courses")
        .select("*")
        .eq("id", sourceId)
        .single()
      if (srcErr || !src) {
        console.error("[useDuplicateCourse:src]", srcErr)
        throw srcErr ?? new Error("Course not found")
      }
      const source = src as Course

      const { data: auth } = await supabase.auth.getUser()
      const suffix = crypto.randomUUID().slice(0, 6)

      // 1. The course row (always a draft, unique slug).
      const { data: created, error: cErr } = await supabase
        .from("courses")
        .insert({
          title: `${source.title} (copy)`,
          slug: source.slug ? `${source.slug}-copy-${suffix}` : null,
          summary: source.summary,
          description: source.description,
          category_id: source.category_id,
          is_cstf_aligned: source.is_cstf_aligned,
          cpd_hours: source.cpd_hours,
          duration_mins: source.duration_mins,
          is_published: false,
          thumbnail_url: source.thumbnail_url,
          organisation_id: source.organisation_id,
          created_by: auth.user?.id ?? null,
        })
        .select("id")
        .single()
      if (cErr || !created) {
        console.error("[useDuplicateCourse:create]", cErr)
        throw cErr ?? new Error("Could not create the copy")
      }
      const newId = created.id as string

      // 2. Curriculum: modules then their lessons.
      const curriculum = await getCurriculum(sourceId)
      for (const mod of curriculum) {
        const { data: newMod, error: mErr } = await supabase
          .from("modules")
          .insert({ course_id: newId, title: mod.title, position: mod.position })
          .select("id")
          .single()
        if (mErr || !newMod) {
          console.error("[useDuplicateCourse:module]", mErr)
          throw mErr ?? new Error("Could not copy a module")
        }
        if (mod.lessons.length) {
          const { error: lErr } = await supabase.from("lessons").insert(
            mod.lessons.map((l) => ({
              module_id: newMod.id,
              title: l.title,
              type: l.type,
              content: l.content,
              video_url: l.video_url,
              scorm_url: l.scorm_url,
              document_url: l.document_url,
              duration_mins: l.duration_mins,
              position: l.position,
            })),
          )
          if (lErr) {
            console.error("[useDuplicateCourse:lessons]", lErr)
            throw lErr
          }
        }
      }

      // 3. FAQs.
      const { data: faqs } = await supabase
        .from("course_faqs")
        .select("question, answer, position")
        .eq("course_id", sourceId)
      if (faqs && faqs.length) {
        await supabase
          .from("course_faqs")
          .insert(faqs.map((f) => ({ ...f, course_id: newId })))
      }

      // 4. Prerequisites.
      const { data: prereqs } = await supabase
        .from("course_prerequisites")
        .select("prerequisite_id")
        .eq("course_id", sourceId)
      if (prereqs && prereqs.length) {
        await supabase.from("course_prerequisites").insert(
          prereqs.map((p) => ({
            course_id: newId,
            prerequisite_id: p.prerequisite_id,
          })),
        )
      }

      return newId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coursesKeys.all })
    },
  })
}

export function useImportCurriculum(courseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      modules: ImportModule[],
    ): Promise<{ modules: number; lessons: number }> => {
      // Append after existing modules.
      const { count } = await supabase
        .from("modules")
        .select("*", { count: "exact", head: true })
        .eq("course_id", courseId)
        .is("deleted_at", null)
      let mPos = count ?? 0
      let lessonTotal = 0

      for (const m of modules) {
        const { data: mod, error } = await supabase
          .from("modules")
          .insert({ course_id: courseId, title: m.title, position: mPos++ })
          .select("id")
          .single()
        if (error) {
          console.error("[useImportCurriculum:module]", error)
          throw error
        }
        if (m.lessons.length) {
          const { error: lErr } = await supabase.from("lessons").insert(
            m.lessons.map((l, i) => ({
              module_id: mod.id,
              title: l.title,
              type: "text" as LessonType,
              content: l.content || null,
              duration_mins: 0,
              position: i,
            })),
          )
          if (lErr) {
            console.error("[useImportCurriculum:lessons]", lErr)
            throw lErr
          }
          lessonTotal += m.lessons.length
        }
      }
      return { modules: modules.length, lessons: lessonTotal }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coursesKeys.curriculum(courseId) }),
  })
}

export function useCurriculumMutations(courseId: string) {
  const qc = useQueryClient()
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: coursesKeys.curriculum(courseId) })

  const addModule = useMutation({
    mutationFn: async ({ title, position }: { title: string; position: number }) => {
      const { error } = await supabase
        .from("modules")
        .insert({ course_id: courseId, title, position })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateModule = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from("modules").update({ title }).eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("modules")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const reorderModules = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from("modules").update({ position: i }).eq("id", id),
        ),
      )
    },
    onSuccess: invalidate,
  })

  const addLesson = useMutation({
    mutationFn: async ({
      moduleId,
      values,
      position,
    }: {
      moduleId: string
      values: LessonFormValues
      position: number
    }) => {
      const { error } = await supabase.from("lessons").insert({
        module_id: moduleId,
        title: values.title,
        type: values.type as LessonType,
        content: values.content || null,
        video_url: values.video_url || null,
        scorm_url: values.scorm_url || null,
        document_url: values.document_url || null,
        duration_mins: values.duration_mins,
        position,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateLesson = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: LessonFormValues }) => {
      const { error } = await supabase
        .from("lessons")
        .update({
          title: values.title,
          type: values.type as LessonType,
          content: values.content || null,
          video_url: values.video_url || null,
          scorm_url: values.scorm_url || null,
          document_url: values.document_url || null,
          duration_mins: values.duration_mins,
        })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lessons")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const reorderLessons = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from("lessons").update({ position: i }).eq("id", id),
        ),
      )
    },
    onSuccess: invalidate,
  })

  return {
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
    addLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
  }
}

// ─── Enrolment ───────────────────────────────────────────────────────────────
export interface MyCourse {
  course: Course
  enrolled: boolean
  progressPct: number
  enrolmentId: string | null
}

export async function getMyCourses(): Promise<MyCourse[]> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  const [published, enrolments] = await Promise.all([
    supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("title", { ascending: true }),
    uid
      ? supabase
          .from("enrollments")
          .select("id, course_id, progress_pct")
          .eq("learner_id", uid)
          .is("deleted_at", null)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (published.error) {
    console.error("[getMyCourses]", published.error)
    throw published.error
  }
  const byCourse = new Map(
    (enrolments.data ?? []).map((e) => [e.course_id, e]),
  )
  return (published.data as Course[]).map((c) => {
    const e = byCourse.get(c.id)
    return {
      course: c,
      enrolled: !!e,
      progressPct: e?.progress_pct ?? 0,
      enrolmentId: e?.id ?? null,
    }
  })
}

export function useMyCourses() {
  return useQuery({ queryKey: coursesKeys.myEnrolments(), queryFn: getMyCourses })
}

export function useEnrolSelf() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) throw new Error("Not signed in")
      const { error } = await supabase
        .from("enrollments")
        .insert({ course_id: courseId, learner_id: auth.user.id })
      if (error) {
        console.error("[useEnrolSelf]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: coursesKeys.myEnrolments() }),
  })
}

// ─── Lesson progress (learner) ───────────────────────────────────────────────
export function lessonProgressKey(courseId: string) {
  return [...coursesKeys.all, "progress", courseId] as const
}

export async function getCompletedLessonIds(
  lessonIds: string[],
): Promise<Set<string>> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user || lessonIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("learner_id", auth.user.id)
    .eq("completed", true)
    .in("lesson_id", lessonIds)
  if (error) {
    console.error("[getCompletedLessonIds]", error)
    return new Set()
  }
  return new Set((data ?? []).map((d) => d.lesson_id))
}

export function useCompletedLessons(courseId: string, lessonIds: string[]) {
  return useQuery({
    queryKey: [...lessonProgressKey(courseId), lessonIds.length],
    queryFn: () => getCompletedLessonIds(lessonIds),
    enabled: lessonIds.length > 0,
  })
}

/** Mark a lesson complete and recompute the enrolment progress percentage. */
/**
 * Mark a lesson complete, recompute the learner's course progress, and — when
 * every lesson in THIS course is done — complete the enrolment and auto-issue a
 * certificate (once). Pass the course's lesson ids so progress is scoped to the
 * course rather than every lesson the learner has ever finished.
 */
export function useMarkLessonComplete(courseId: string, lessonIds: string[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) throw new Error("Not signed in")
      const uid = auth.user.id

      const { error: upErr } = await supabase.from("lesson_progress").upsert(
        {
          learner_id: uid,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "learner_id,lesson_id" },
      )
      if (upErr) {
        console.error("[useMarkLessonComplete]", upErr)
        throw upErr
      }

      const total = lessonIds.length
      // Count only the completed lessons that belong to this course.
      const { count } =
        total > 0
          ? await supabase
              .from("lesson_progress")
              .select("lesson_id", { count: "exact", head: true })
              .eq("learner_id", uid)
              .eq("completed", true)
              .in("lesson_id", lessonIds)
          : { count: 0 }
      const pct =
        total > 0 ? Math.min(100, Math.round(((count ?? 0) / total) * 100)) : 0
      const lessonsDone = pct >= 100 && total > 0

      // A course is only complete once its published assessment (if any) is
      // passed. When lessons are done but the assessment is not yet passed, the
      // enrolment stays in progress and no certificate is issued.
      let assessmentPending = false
      let done = lessonsDone
      if (lessonsDone) {
        const { data: assess } = await supabase
          .from("assessments")
          .select("id")
          .eq("course_id", courseId)
          .eq("is_published", true)
          .limit(1)
        if (assess && assess.length > 0) {
          const { data: passed } = await supabase
            .from("assessment_attempts")
            .select("id")
            .eq("assessment_id", assess[0].id)
            .eq("learner_id", uid)
            .eq("passed", true)
            .limit(1)
          const hasPassed = (passed?.length ?? 0) > 0
          done = hasPassed
          assessmentPending = !hasPassed
        }
      }

      await supabase
        .from("enrollments")
        .update({
          progress_pct: pct,
          status: done ? "completed" : "in_progress",
          completed_at: done ? new Date().toISOString() : null,
        })
        .eq("course_id", courseId)
        .eq("learner_id", uid)

      // Issue the certificate server-side. The browser cannot insert into
      // learner_certificates (RLS is staff-only), so we call a SECURITY DEFINER
      // function that re-validates enrolment, lesson completion and the
      // assessment pass, and is idempotent. Returns the cert id or null.
      //
      // Nothing here gates that call on a client-side enrolment check any more.
      // A learner who finishes a course and gets no certificate has nothing to
      // show for the work, so the only check that should be able to withhold one
      // is the server's own. A single retry covers the case where the last
      // lesson_progress write is not yet visible to the function.
      let issued = false
      if (done) {
        issued = !!(await issueCourseCertificate(courseId))
        if (!issued) {
          await new Promise((r) => setTimeout(r, 500))
          issued = !!(await issueCourseCertificate(courseId, {
            expectIssued: true,
          }))
        }
      }
      return { done: issued, assessmentPending }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: lessonProgressKey(courseId) })
      qc.invalidateQueries({ queryKey: coursesKeys.myEnrolments() })
      if (res?.done) qc.invalidateQueries({ queryKey: ["certificates"] })
    },
  })
}
