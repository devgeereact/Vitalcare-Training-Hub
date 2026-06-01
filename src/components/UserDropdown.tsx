"use client"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

import {
  User,
  Settings,
  LayoutDashboard,
  Download,
  DollarSign,
  LogOut,
} from "lucide-react"

import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  trainer: "Trainer",
  learner: "Learner",
}

export function UserDropdown() {
  const navigate = useNavigate()
  const { user, profile, role, signOut } = useAuth()

  const displayName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Account"
  const displayMeta = role ? ROLE_LABELS[role] : (user?.email ?? "")
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  const avatarUrl = profile?.avatar_url ?? undefined

  const handleSignOut = async () => {
    await signOut()
    navigate("/sign-in", { replace: true })
  }

  return (
    <DropdownMenu>
      {/* Trigger */}
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full h-10 w-10 p-0 overflow-hidden ml-2"
        >
          <Avatar className="h-10 w-10 border-border rounded-full">
            {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
            <AvatarFallback>{initials || "VC"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      {/* Content */}
      <DropdownMenuContent align="end" className="w-56 p-3 rounded-xl shadow-xl">
        
        {/* Header */}
        <DropdownMenuLabel className="rounded-xl mb-3 bg-muted/50 border border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
              <AvatarFallback>{initials || "VC"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayMeta}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        {/* Items */}
        <DropdownMenuItem className="gap-2 h-9">
          <User className="!size-5" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem className="gap-2 h-9">
          <Settings className="!size-5" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuItem className="gap-2 h-9">
          <LayoutDashboard className="!size-5" />
          Dashboard
        </DropdownMenuItem>

        <DropdownMenuSeparator className="border-1 my-2"/>

        <DropdownMenuItem className="gap-2 h-9">
          <Download className="!size-5" />
          Downloads
        </DropdownMenuItem>

        <DropdownMenuItem className="gap-2 h-9">
          <DollarSign className="!size-5" />
          Earnings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="border-1 my-2" />

        {/* Logout */}
        <div className="mt-3">
          <Button
           variant={"default"}
           onClick={handleSignOut}
           className="w-full h-8 justify-center gap-2 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}