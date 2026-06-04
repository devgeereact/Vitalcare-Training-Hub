import React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useUser } from "@/hooks/use-user"
import { sidebarEntries } from "@/data/platform-sections"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onHoverChange?: (value: boolean) => void
}

/**
 * Platform side navigation. Flat: one entry per section (no dropdowns). Each
 * section's sub-pages are reached through the segmented SectionTabs rendered at
 * the top of the page. Visible entries are derived from PLATFORM_SECTIONS,
 * role-filtered, so a single source drives the sidebar and the tabs.
 */
export function AppSidebar({ onHoverChange, ...props }: AppSidebarProps) {
  const { profile, role } = useUser()
  const navItems = sidebarEntries(role).map((entry) => ({
    title: entry.title,
    url: entry.url,
    icon: entry.icon,
    sectionId: entry.id,
  }))
  const currentUser = {
    name:
      profile?.full_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "Account",
    email: profile?.email ?? "",
    avatar: profile?.avatar_url ?? "",
  }
  return (
    <div
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader className="border-b border-sidebar-border h-16">
          <SidebarMenuButton size="lg" asChild className="px-2 py-3">
            <a href="/">
              <div className="flex aspect-square size-8 items-center justify-center mx-auto rounded-lg overflow-hidden">
                <img
                  src="/logos/logo-round-white.svg"
                  alt="Vitalcare Training Hub"
                  className="size-8"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Vitalcare Training Hub</span>
                <span className="truncate text-xs opacity-80">CSTF-aligned TMS</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarHeader>

        <SidebarContent>
          <NavMain items={navItems} />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border h-16 justify-center">
          <NavUser user={currentUser} />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </div>
  )
}
