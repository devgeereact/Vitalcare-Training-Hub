import { Outlet, Link, useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import BottomTabBar from "@/components/platform/BottomTabBar"
import SectionTabs from "@/components/platform/SectionTabs"
import React from "react"
import { NotificationDropdown } from "@/components/notification-dropdown"
import AnnouncementPopup from "@/components/platform/AnnouncementPopup"
import AppearanceSync from "@/components/platform/AppearanceSync"
import ProfileCompletionBanner from "@/components/platform/ProfileCompletionBanner"
import AutoAttendance from "@/components/platform/AutoAttendance"
import { IdleLockProvider } from "@/components/auth/IdleLock"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { GlobalSearch } from "@/components/global-search"

import Footer from "@/layouts/Footer"


import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { UserDropdown } from "@/components/UserDropdown"

const CRUMB_LABELS: Record<string, string> = {
  platform: "Platform",
  ai: "AI Assistant",
  org: "Organisation",
  crm: "CRM",
  manage: "All Courses",
}

// UUID or long opaque id segment (e.g. a session/course detail route).
function isIdSegment(seg: string) {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg) ||
    /^\d+$/.test(seg) ||
    (seg.length >= 16 && !seg.includes("-"))
  )
}

function toLabel(seg: string) {
  if (isIdSegment(seg)) return "Detail"
  return (
    CRUMB_LABELS[seg] ??
    seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

function HeaderBreadcrumb() {
  const { pathname } = useLocation()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/")
          const isLast = i === segments.length - 1
          const target = seg === "platform" ? "/platform/dashboard" : href
          // An id segment is never a navigable crumb on its own.
          if (isIdSegment(seg) && !isLast) {
            return null
          }
          return (
            <React.Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{toLabel(seg)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={target}>{toLabel(seg)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default function AppLayout() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(true)
  const [hovered, setHovered] = useState(false)

  const isExpanded = open || hovered


  // Handle header background on scroll
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= 1024)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])


  return (
    <IdleLockProvider>
    <SidebarProvider open={isExpanded} onOpenChange={setOpen}>
      <AppSidebar onHoverChange={setHovered} />

      <SidebarInset>
        {/* HEADER */}
        <header
                className={cn(
                    "px-6 sticky top-0 z-40 flex h-16 w-full shrink-0 items-center gap-2 transition-all duration-200 border-b",
                    scrolled
                    ? "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md"
                    : "bg-transparent"
                )}
              >
              <div className="flex items-center gap-1">
                <SidebarTrigger
                  className="-ml-1 rounded-full h-10 w-10 [&_svg]:!size-5 hover:bg-muted/60 transition-colors"
                />
                <Separator orientation="vertical" className="mx-1 h-6 hidden md:block" />
                <div className="hidden md:flex items-center">
                  <HeaderBreadcrumb />
                </div>
              </div>

                <div className="ml-auto">
                    <div className="flex items-center gap-1">
                        <GlobalSearch />
                        <ThemeToggle />
                        <div className="hidden md:inline-flex">
                            <NotificationDropdown />
                        </div>
                         <UserDropdown />
                    </div>
                </div>
              </header>

        <ProfileCompletionBanner />

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 pb-24 md:pb-6">
          <SectionTabs />
          <Outlet />
        </main>

        <Footer />
        <BottomTabBar />
        <AnnouncementPopup />
        <AppearanceSync />
        <AutoAttendance />
      </SidebarInset>
    </SidebarProvider>
    </IdleLockProvider>
  )
}
