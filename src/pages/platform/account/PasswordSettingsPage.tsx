import SettingsShell from "@/components/settings/SettingsShell"
import PasswordCard from "@/components/settings/PasswordCard"

export default function PasswordSettingsPage(): React.ReactElement {
  return (
    <SettingsShell description="Change the password for your account.">
      <PasswordCard />
    </SettingsShell>
  )
}
