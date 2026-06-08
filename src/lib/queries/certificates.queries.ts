import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

export const certsKeys = {
  all: ["certificates"] as const,
  list: () => [...certsKeys.all, "list"] as const,
  template: () => [...certsKeys.all, "template"] as const,
}

/** Certificate lifecycle status, derived from expires_at. */
export type CertStatus = "active" | "expiring" | "expired" | "no_expiry"

export interface CertRow {
  id: string
  learnerId: string
  learnerName: string
  organisation: string | null
  certificateNumber: string | null
  courseTitle: string
  cpdHours: number
  issuedAt: string
  expiresAt: string | null
  verificationUuid: string
  verificationCode: string
  approved: boolean
  status: CertStatus
  daysToExpiry: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Classify a certificate from its expiry date. Within 30 days is "expiring". */
export function certStatus(expiresAt: string | null): {
  status: CertStatus
  daysToExpiry: number | null
} {
  if (!expiresAt) return { status: "no_expiry", daysToExpiry: null }
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / DAY_MS)
  if (days < 0) return { status: "expired", daysToExpiry: days }
  if (days <= 30) return { status: "expiring", daysToExpiry: days }
  return { status: "active", daysToExpiry: days }
}

export async function getCertificates(): Promise<CertRow[]> {
  const { data, error } = await supabase
    .from("learner_certificates")
    .select(
      "id, learner_id, course_id, certificate_number, cpd_hours, issued_at, expires_at, verification_uuid, verification_code, approved",
    )
    .is("deleted_at", null)
    .order("issued_at", { ascending: false })
    .limit(500)
  if (error) {
    console.error("[getCertificates]", error)
    throw error
  }
  if (!data || data.length === 0) return []

  const learnerIds = [...new Set(data.map((d) => d.learner_id))]
  const courseIds = [...new Set(data.map((d) => d.course_id).filter(Boolean))]
  const [profiles, courses] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name, organisation_id")
      .in("id", learnerIds),
    courseIds.length
      ? supabase.from("courses").select("id, title").in("id", courseIds as string[])
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ])
  const nameById = new Map(
    (profiles.data ?? []).map((p) => [
      p.id,
      p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
    ]),
  )

  // Resolve organisation names for the learners that have one.
  const orgIds = [
    ...new Set(
      (profiles.data ?? []).map((p) => p.organisation_id).filter(Boolean),
    ),
  ] as string[]
  const orgById = new Map<string, string>()
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from("organisations")
      .select("id, name")
      .in("id", orgIds)
    for (const o of orgs ?? []) orgById.set(o.id, o.name)
  }
  const orgByLearner = new Map(
    (profiles.data ?? []).map((p) => [
      p.id,
      p.organisation_id ? orgById.get(p.organisation_id) ?? null : null,
    ]),
  )
  const titleById = new Map((courses.data ?? []).map((c) => [c.id, c.title]))

  return data.map((d) => {
    const { status, daysToExpiry } = certStatus(d.expires_at)
    return {
      id: d.id,
      learnerId: d.learner_id,
      learnerName: nameById.get(d.learner_id) ?? "Unknown",
      organisation: orgByLearner.get(d.learner_id) ?? null,
      certificateNumber: d.certificate_number,
      courseTitle: d.course_id ? titleById.get(d.course_id) ?? "-" : "Standalone",
      cpdHours: d.cpd_hours,
      issuedAt: d.issued_at,
      expiresAt: d.expires_at,
      verificationUuid: d.verification_uuid,
      // verification_code is added in migration 081, not yet in generated types.
      verificationCode:
        (d as { verification_code?: string | null }).verification_code ?? "",
      approved: (d as { approved?: boolean }).approved ?? true,
      status,
      daysToExpiry,
    }
  })
}

export function useCertificates() {
  return useQuery({ queryKey: certsKeys.list(), queryFn: getCertificates })
}

export interface CertStats {
  total: number
  active: number
  expired: number
  expiringSoon: number
}

export async function getCertStats(): Promise<CertStats> {
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const { data, error } = await supabase
    .from("learner_certificates")
    .select("expires_at")
    .is("deleted_at", null)
  if (error) {
    console.error("[getCertStats]", error)
    throw error
  }
  const rows = data ?? []
  let expired = 0
  let expiringSoon = 0
  for (const r of rows) {
    if (!r.expires_at) continue
    const exp = new Date(r.expires_at)
    if (exp < now) expired += 1
    else if (exp <= in30) expiringSoon += 1
  }
  return {
    total: rows.length,
    active: rows.length - expired,
    expired,
    expiringSoon,
  }
}

export function useCertStats() {
  return useQuery({ queryKey: [...certsKeys.all, "stats"], queryFn: getCertStats })
}

export interface VerifyResult {
  learner_name: string
  course_title: string
  cpd_hours: number
  issued_at: string
  expires_at: string | null
  verification_code: string
  is_valid: boolean
}

export async function verifyByCode(code: string): Promise<VerifyResult | null> {
  // verify_certificate(text) is added in migration 081; call it untyped.
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: VerifyResult[] | null; error: { message: string } | null }>
  const { data, error } = await rpc("verify_certificate", { p_code: code.trim() })
  if (error) {
    console.error("[verifyByCode]", error)
    throw new Error(error.message)
  }
  return data?.[0] ?? null
}

/** The signed-in learner's certificate for a course, with its approval state. */
export function useMyCourseCertificate(
  courseId: string,
  learnerId: string | undefined,
) {
  return useQuery({
    queryKey: ["cert", "course", courseId, learnerId ?? "none"],
    enabled: !!courseId && !!learnerId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<{ approved: boolean } | null> => {
      const { data, error } = await supabase
        .from("learner_certificates")
        .select("approved")
        .eq("course_id", courseId)
        .eq("learner_id", learnerId!)
        .is("deleted_at", null)
        .order("issued_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) {
        console.error("[useMyCourseCertificate]", error)
        return null
      }
      return data ? { approved: Boolean(data.approved) } : null
    },
  })
}

/** Admin approves a pending certificate (RPC added in migration 083). */
export function useApproveCertificate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (certId: string) => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>
      const { error } = await rpc("approve_certificate", { p_id: certId })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: certsKeys.all }),
  })
}

export interface IssueCertInput {
  learnerId: string
  courseId: string | null
  cpdHours: number
  expiresAt: string | null
}

export function useIssueCertificate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: IssueCertInput) => {
      const { error } = await supabase.from("learner_certificates").insert({
        learner_id: input.learnerId,
        course_id: input.courseId,
        cpd_hours: input.cpdHours,
        expires_at: input.expiresAt,
      })
      if (error) {
        console.error("[useIssueCertificate]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: certsKeys.list() }),
  })
}

// ---------------------------------------------------------------------------
// Certificate template designer
// ---------------------------------------------------------------------------

/** The designable sections of a certificate (single original layout). */
export interface CertTemplate {
  id: string | null
  name: string
  titleText: string
  introText: string
  completionText: string
  accreditationLine: string
  signatoryName: string
  signatoryRole: string
  signatureImageUrl: string | null
  footerText: string
}

/** Sensible defaults that carry the Clinical Director sign-off. */
export const DEFAULT_TEMPLATE: CertTemplate = {
  id: null,
  name: "Standard certificate",
  titleText: "Certificate of Completion",
  introText: "This is to certify that",
  completionText: "has successfully completed",
  accreditationLine: "CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify",
  signatoryName: "Harni Muharami RN MSc",
  signatoryRole: "Clinical Director",
  signatureImageUrl: null,
  footerText: "Vitalcare Training Hub Ltd · Company No. 15718997",
}

interface TemplateRow {
  id: string
  name: string
  title_text: string
  intro_text: string
  completion_text: string
  accreditation_line: string
  signatory_name: string
  signatory_role: string
  signature_image_url: string | null
  footer_text: string
}

function rowToTemplate(r: TemplateRow): CertTemplate {
  return {
    id: r.id,
    name: r.name,
    titleText: r.title_text,
    introText: r.intro_text,
    completionText: r.completion_text,
    accreditationLine: r.accreditation_line,
    signatoryName: r.signatory_name,
    signatoryRole: r.signatory_role,
    signatureImageUrl: r.signature_image_url,
    footerText: r.footer_text,
  }
}

const TEMPLATE_COLS =
  "id, name, title_text, intro_text, completion_text, accreditation_line, signatory_name, signatory_role, signature_image_url, footer_text"

/**
 * Section columns are added by migration 033 but are not in the committed
 * generated database types. This minimal builder lets us read and write them
 * without `any`. The runtime client is untouched; only its static type narrows.
 */
interface TemplateBuilder {
  select: (cols: string) => {
    is: (col: string, val: null) => {
      eq: (col: string, val: boolean) => {
        limit: (n: number) => {
          maybeSingle: () => Promise<{ data: TemplateRow | null; error: unknown }>
        }
      }
    }
  }
  insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>
  update: (row: Record<string, unknown>) => {
    eq: (col: string, val: string) => Promise<{ error: unknown }>
  }
}

function templateTable(): TemplateBuilder {
  return supabase.from("certificate_templates") as unknown as TemplateBuilder
}

/** Load the default template, or defaults if none has been saved yet. */
export async function getDefaultTemplate(): Promise<CertTemplate> {
  const { data, error } = await templateTable()
    .select(TEMPLATE_COLS)
    .is("deleted_at", null)
    .eq("is_default", true)
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error("[getDefaultTemplate]", error)
    throw error
  }
  return data ? rowToTemplate(data) : DEFAULT_TEMPLATE
}

export function useDefaultTemplate() {
  return useQuery({ queryKey: certsKeys.template(), queryFn: getDefaultTemplate })
}

/** Upload a signature image to the public certificate-signatures bucket. */
export async function uploadSignatureImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png"
  const path = `signatures/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from("certificate-signatures")
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) {
    console.error("[uploadSignatureImage]", error)
    throw error
  }
  const { data } = supabase.storage.from("certificate-signatures").getPublicUrl(path)
  return data.publicUrl
}

/** Insert or update the default certificate template. */
export function useSaveTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (t: CertTemplate) => {
      const payload = {
        name: t.name.trim() || "Standard certificate",
        title_text: t.titleText,
        intro_text: t.introText,
        completion_text: t.completionText,
        accreditation_line: t.accreditationLine,
        signatory_name: t.signatoryName,
        signatory_role: t.signatoryRole,
        signature_image_url: t.signatureImageUrl,
        footer_text: t.footerText,
        is_default: true,
        canvas: {},
        width: 297,
        height: 210,
      }
      if (t.id) {
        const { error } = await templateTable().update(payload).eq("id", t.id)
        if (error) {
          console.error("[useSaveTemplate:update]", error)
          throw error
        }
      } else {
        const { error } = await templateTable().insert(payload)
        if (error) {
          console.error("[useSaveTemplate:insert]", error)
          throw error
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: certsKeys.template() }),
  })
}
