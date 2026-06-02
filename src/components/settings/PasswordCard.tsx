import { useState } from "react"
import { toast } from "sonner"
import { KeyRound, Loader2, Save } from "lucide-react"

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

/**
 * Inline change-password card. Shared by the comprehensive Settings page and the
 * dedicated /platform/account/password route so the logic lives in one place.
 */
export default function PasswordCard(): React.ReactElement {
  const [pw, setPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)

  async function save(): Promise<void> {
    if (pw.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }
    if (pw !== confirm) {
      toast.error("Passwords do not match.")
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setSaving(false)
    if (error) {
      console.error("[PasswordCard]", error)
      toast.error("Could not update password", { description: error.message })
      return
    }
    setPw("")
    setConfirm("")
    toast.success("Password updated")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5 text-brand-navy" /> Password
        </CardTitle>
        <CardDescription>
          Change your sign-in password. At least 8 characters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs">New password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Confirm new password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void save()
              }}
            />
          </div>
        </div>
        <div className="flex justify-end border-t border-border pt-4">
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Update password
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
