"use client"

import { useEffect, useState } from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { findSection } from "@/data/platform-sections"

type MenuItem = {
  title: string
  url: string
  icon?: LucideIcon
  items?: MenuItem[]
  /** Roles allowed to see this entry. Undefined = visible to every signed-in user. */
  roles?: string[]
  /**
   * Platform section this entry represents. When set, the entry is active for
   * any route inside the section, so the highlight holds as you move between its
   * sub-tabs (not just the section's first page).
   */
  sectionId?: string
}

export function NavMain({ items }: { items: MenuItem[] }) {
  const location = useLocation()
  // Only one top-level group open at a time -> cleaner navigation.
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  const isActiveRoute = (url: string) => {
    if (!url || url === "#") return false
    const u = url.startsWith("/") ? url : `/${url}`
    return location.pathname === u || location.pathname.startsWith(`${u}/`)
  }

  // A flat section entry stays active across all of its sub-tabs: match by the
  // section that owns the current route (longest-prefix), not the first page.
  const isEntryActive = (item: MenuItem) =>
    item.sectionId
      ? findSection(location.pathname)?.id === item.sectionId
      : isActiveRoute(item.url)

  // Auto-open the group that owns the active route; collapse the rest.
  useEffect(() => {
    const active = items.find((it) =>
      it.items?.some(
        (s) => isActiveRoute(s.url) || s.items?.some((c) => isActiveRoute(c.url)),
      ),
    )
    if (active) setOpenGroup(active.title)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const renderMenuItems = (menuItems: MenuItem[]) => {
    return menuItems.map((item) => {
      const hasChildren = item.items && item.items.length > 0

      // Check if any child is active
      const isParentActive =
  hasChildren &&
  item.items!.some((sub) => {
    if (isActiveRoute(sub.url)) {
      return true
    }

    if (sub.items) {
      return sub.items.some((child) =>
        isActiveRoute(child.url)
      )
    }

    return false
  })

      if (!hasChildren) {
        return (
          <SidebarMenuItem key={item.title}>
  <SidebarMenuButton
    asChild
    tooltip={item.title}
    isActive={isEntryActive(item)}
  >
    <Link to={item.url}>
      {item.icon && <item.icon className="h-4 w-4" />}
      <span>{item.title}</span>
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
        )
      }

      return (
        <Collapsible
  key={item.title}
  asChild
  open={openGroup === item.title}
  onOpenChange={(o) => setOpenGroup(o ? item.title : null)}
  className="group/collapsible"
>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
  tooltip={item.title}
  isActive={isParentActive}
>
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) =>
                  subItem.items ? (
                    <SidebarMenuSubItem key={subItem.title}>
                      <Collapsible
                        defaultOpen={subItem.items.some((child) =>
                          isActiveRoute(child.url)
                        )}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuSubButton>
                            <span>{subItem.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuSubButton>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {subItem.items.map((child) => (
                              <SidebarMenuSubItem key={child.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActiveRoute(child.url)}
                                >
                                  <Link to={child.url}>
                                    <span>{child.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuSubItem>
                  ) : (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActiveRoute(subItem.url)}
                      >
                        <Link to={subItem.url}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      )
    })
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {renderMenuItems(items)}
      </SidebarMenu>
    </SidebarGroup>
  )
}