"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, BadgeCheckIcon, Settings as SettingsIcon, BellIcon, LogOutIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
 const { isMobile, state } = useSidebar()

const collapsed = state === "collapsed"

const navigate = useNavigate()
const { signOut } = useAuth()

const initials =
  user.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U"

const handleSignOut = async () => {
  await signOut()
  navigate("/sign-in", { replace: true })
}

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
  {collapsed ? (
    <button
      className="
        flex h-12 w-12 items-center justify-center
        rounded-xl mx-auto hover:bg-sidebar-accent
      "
    >
      <Avatar className="h-9 w-9 rounded-xl">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
    </button>
  ) : (
    <SidebarMenuButton
      size="lg"
      className="
        px-2 text-sidebar-foreground
        hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
        data-[state=open]:bg-sidebar-accent
        data-[state=open]:text-sidebar-accent-foreground
      "
    >
      <Avatar className="h-9 w-9 rounded-xl shrink-0">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs opacity-80">{user.email}</span>
      </div>

      <ChevronsUpDownIcon className="ml-auto size-4 opacity-80" />
    </SidebarMenuButton>
  )}
</DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 p-3 rounded-xl shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal rounded-xl border-1 mb-3 bg-muted/50 border">
              <div className="flex items-center gap-2 text-left text-sm p-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2"/>
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2 h-9" onClick={() => navigate("/platform/profile")}>
                <BadgeCheckIcon className="!size-5" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 h-9" onClick={() => navigate("/platform/settings")}>
                <SettingsIcon className="!size-5" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 h-9" onClick={() => navigate("/platform/notifications")}>
                <BellIcon className="!size-5" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-2"/>
            <DropdownMenuItem className="gap-2 h-9" onClick={handleSignOut}>
              <LogOutIcon className="!size-5"
              />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
