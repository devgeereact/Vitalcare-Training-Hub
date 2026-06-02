import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Download,
  Save,
  Upload,
  RotateCcw,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { CertificatePreview } from "@/components/certificates/CertificatePreview"
import { downloadCertificatePdf } from "@/lib/certificates/pdf"
import {
  DEFAULT_TEMPLATE,
  uploadSignatureImage,
  useDefaultTemplate,
  useSaveTemplate,
  type CertTemplate,
} from "@/lib/queries/certificates.queries"

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

export default function CertTemplatesPage() {
  const { data, isLoading, isError, refetch } = useDefaultTemplate()
  const save = useSaveTemplate()
  const [tpl, setTpl] = useState<CertTemplate>(DEFAULT_TEMPLATE)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Hydrate the form once the saved template loads.
  useEffect(() => {
    if (data) setTpl(data)
  }, [data])

  function set<K extends keyof CertTemplate>(key: K, value: CertTemplate[K]) {
    setTpl((prev) => ({ ...prev, [key]: value }))
  }

  async function onUpload(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (PNG or JPG).")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Signature image must be under 2MB.")
      return
    }
    setUploading(true)
    try {
      const url = await uploadSignatureImage(file)
      set("signatureImageUrl", url)
      toast.success("Signature uploaded")
    } catch {
      toast.error("Could not upload the signature image.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function onSave() {
    save
      .mutateAsync(tpl)
      .then(() => toast.success("Template saved"))
      .catch(() => toast.error("Could not save the template."))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link to="/platform/certificates">
              <ArrowLeft className="mr-1.5 size-4" /> Back to certificates
            </Link>
          </Button>
          <h1 className="font-display text-3xl text-foreground">Certificate designer</h1>
          <p className="mt-1 text-muted-foreground">
            Set the wording for each section. Changes preview live on the right and
            apply to every certificate you issue.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setTpl(data ?? DEFAULT_TEMPLATE)}
            disabled={save.isPending}
          >
            <RotateCcw className="mr-2 size-4" /> Reset
          </Button>
          <Button onClick={onSave} disabled={save.isPending || isLoading}>
            {save.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription>
              Placeholders for learner name, course and issue date are filled in
              automatically when a certificate is issued.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertCircle className="size-8 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  Could not load the template.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <Section title="Template name" description="For your reference only.">
                  <Input
                    value={tpl.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Standard certificate"
                  />
                </Section>

                <Separator />

                <Section title="Title">
                  <Input
                    value={tpl.titleText}
                    onChange={(e) => set("titleText", e.target.value)}
                    placeholder="Certificate of Completion"
                  />
                </Section>

                <Section
                  title="Recital"
                  description="The lines shown above and below the learner name and course."
                >
                  <div className="space-y-2">
                    <Label className="text-xs">Before the learner name</Label>
                    <Input
                      value={tpl.introText}
                      onChange={(e) => set("introText", e.target.value)}
                      placeholder="This is to certify that"
                    />
                    <Label className="text-xs">Before the course name</Label>
                    <Input
                      value={tpl.completionText}
                      onChange={(e) => set("completionText", e.target.value)}
                      placeholder="has successfully completed"
                    />
                  </div>
                </Section>

                <Section
                  title="Accreditation line"
                  description="Shown beneath the issue date."
                >
                  <Input
                    value={tpl.accreditationLine}
                    onChange={(e) => set("accreditationLine", e.target.value)}
                    placeholder="CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify"
                  />
                </Section>

                <Separator />

                <Section
                  title="Signature"
                  description="Every certificate carries the Clinical Director sign-off. You may add a signature image."
                >
                  <div className="space-y-2">
                    <Label className="text-xs">Signatory name</Label>
                    <Input
                      value={tpl.signatoryName}
                      onChange={(e) => set("signatoryName", e.target.value)}
                      placeholder="Harni Muharami RN MSc"
                    />
                    <Label className="text-xs">Signatory role</Label>
                    <Input
                      value={tpl.signatoryRole}
                      onChange={(e) => set("signatoryRole", e.target.value)}
                      placeholder="Clinical Director"
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    {tpl.signatureImageUrl ? (
                      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2">
                        <img
                          src={tpl.signatureImageUrl}
                          alt="Signature"
                          className="h-8 w-auto object-contain"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label="Remove signature image"
                          onClick={() => set("signatureImageUrl", null)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : null}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={(e) => onUpload(e.target.files?.[0])}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 size-4" />
                      )}
                      {tpl.signatureImageUrl ? "Replace image" : "Upload signature image"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    With no image, the signatory name is rendered in a cursive style
                    above the line. PNG or JPG, under 2MB.
                  </p>
                </Section>

                <Separator />

                <Section title="Footer">
                  <Input
                    value={tpl.footerText}
                    onChange={(e) => set("footerText", e.target.value)}
                    placeholder="Vitalcare Training Hub Ltd · Company No. 15718997"
                  />
                </Section>
              </>
            )}
          </CardContent>
        </Card>

        {/* Live preview */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Live preview</CardTitle>
                <CardDescription>A4 landscape, sample learner.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadCertificatePdf({
                    learnerName: "Jane Okafor",
                    courseTitle: "Moving and Handling",
                    issuedAt: new Date().toISOString(),
                    verificationUuid: "00000000-0000-0000-0000-000000000000",
                    titleText: tpl.titleText,
                    introText: tpl.introText,
                    completionText: tpl.completionText,
                    accreditationLine: tpl.accreditationLine,
                    footerText: tpl.footerText,
                    signatoryName: tpl.signatoryName,
                    signatoryRole: tpl.signatoryRole,
                  }).catch(() => toast.error("Could not generate the preview PDF."))
                }}
              >
                <Download className="mr-2 size-4" /> Preview PDF
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="mx-auto aspect-[297/210] w-full rounded-md" />
              ) : (
                <CertificatePreview template={tpl} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
