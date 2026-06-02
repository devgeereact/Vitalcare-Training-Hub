import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

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
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export default function ProfileDetailsCard() {
  const { profile, refreshProfile } = useAuth()
  const [firstName, setFirstName] = useState(profile?.first_name ?? "")
  const [lastName, setLastName] = useState(profile?.last_name ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [ecName, setEcName] = useState(profile?.emergency_contact_name ?? "")
  const [ecPhone, setEcPhone] = useState(profile?.emergency_contact_phone ?? "")
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!profile?.id) return
    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
        emergency_contact_name: ecName.trim() || null,
        emergency_contact_phone: ecPhone.trim() || null,
      })
      .eq("id", profile.id)
    setSaving(false)
    if (error) {
      console.error("[ProfileDetailsCard]", error)
      toast.error("Could not save")
      return
    }
    await refreshProfile()
    toast.success("Profile updated")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your details</CardTitle>
        <CardDescription>
          Keep these up to date. An emergency contact is required.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs">First name</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Last name</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div />
        <div>
          <Label className="mb-1.5 block text-xs">Emergency contact name</Label>
          <Input value={ecName} onChange={(e) => setEcName(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Emergency contact phone</Label>
          <Input value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
