import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Save, UserRound } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import AiFieldsButton from "@/components/ai/AiFieldsButton"
import {
  readProfileExtras,
  updateOwnProfile,
} from "@/lib/queries/profile.queries"

/**
 * The single place to edit account details. Writes through `updateOwnProfile`,
 * which never touches the generated `full_name` column. The read-only profile
 * page reflects whatever is saved here.
 */
export default function AccountSettingsCard(): React.ReactElement {
  const { profile, refreshProfile } = useAuth()
  const extras = readProfileExtras(profile)
  const [firstName, setFirstName] = useState(profile?.first_name ?? "")
  const [lastName, setLastName] = useState(profile?.last_name ?? "")
  const [jobTitle, setJobTitle] = useState(extras.job_title ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [ecName, setEcName] = useState(profile?.emergency_contact_name ?? "")
  const [ecPhone, setEcPhone] = useState(
    profile?.emergency_contact_phone ?? "",
  )
  const [about, setAbout] = useState(profile?.about ?? "")
  const [saving, setSaving] = useState(false)

  async function save(): Promise<void> {
    if (!profile?.id) return
    setSaving(true)
    try {
      await updateOwnProfile(profile.id, {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        job_title: jobTitle.trim() || null,
        phone: phone.trim() || null,
        emergency_contact_name: ecName.trim() || null,
        emergency_contact_phone: ecPhone.trim() || null,
        about: about.trim() || null,
      })
      await refreshProfile()
      toast.success("Profile updated")
    } catch {
      toast.error("Could not save your details. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-5 text-brand-navy" /> Account
        </CardTitle>
        <CardDescription>
          Your name, contact details and bio. An emergency contact is required.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs">First name</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Last name</Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Job title</Label>
          <Input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Care Assistant"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">
            Emergency contact name
          </Label>
          <Input value={ecName} onChange={(e) => setEcName(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">
            Emergency contact phone
          </Label>
          <Input
            value={ecPhone}
            onChange={(e) => setEcPhone(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="text-xs">About me</Label>
            <AiFieldsButton
              subject="a short professional 'about me' bio for a healthcare training profile"
              context={`Name: ${firstName} ${lastName}`}
              fields={[{ key: "about", label: "About", format: "text" }]}
              label="AI: write bio"
              onApply={(v) => v.about && setAbout(v.about)}
            />
          </div>
          <Textarea
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
          />
        </div>
        <div className="flex justify-end border-t border-border pt-4 sm:col-span-2">
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
