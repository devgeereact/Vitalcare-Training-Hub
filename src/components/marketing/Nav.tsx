import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronDown, Menu, X, LayoutDashboard, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/data/nav"
import { useAuth } from "@/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { session, profile, role, signOut } = useAuth()
  const navigate = useNavigate()

  const signedIn = !!session && role !== "guest"
  const firstName =
    profile?.first_name || profile?.full_name?.split(" ")[0] || "Account"

  async function handleSignOut() {
    await signOut()
    setMobileOpen(false)
    navigate("/")
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const closeMobile = () => setMobileOpen(false)

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-200",
        scrolled
          ? "border-b border-brand-navy/10 bg-white/80 backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className={cn("flex items-center", FOCUS)} aria-label="Vitalcare Training Hub home">
          <img
            src="/logos/logo-horizontal-navy.svg"
            alt="Vitalcare Training Hub"
            className="h-9 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-navy/5",
                    FOCUS,
                  )}
                >
                  {item.label}
                  <ChevronDown className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  {item.children.map((child) => (
                    <DropdownMenuItem key={child.href} asChild>
                      <Link to={child.href}>{child.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.label}
                to={item.href ?? "/"}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-navy/5",
                  FOCUS,
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {signedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border border-brand-navy/20 bg-brand-navy/5 px-3 py-2 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-navy/10",
                  FOCUS,
                )}
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
                  {firstName.charAt(0).toUpperCase()}
                </span>
                {firstName}
                <ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                  {profile?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/platform/dashboard">
                    <LayoutDashboard className="mr-2 size-4" /> Go to platform
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                to="/sign-in"
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-navy/5",
                  FOCUS,
                )}
              >
                Sign in
              </Link>
              <Link
                to="/sign-up"
                className={cn(
                  "rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark",
                  FOCUS,
                )}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className={cn("rounded-md p-2 text-brand-navy lg:hidden", FOCUS)}
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40 motion-safe:animate-in motion-safe:fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85%] flex-col bg-white p-6 shadow-xl motion-safe:animate-in motion-safe:slide-in-from-right">
            <div className="mb-6 flex items-center justify-between">
              <img
                src="/logos/logo-horizontal-navy.svg"
                alt="Vitalcare Training Hub"
                className="h-8 w-auto"
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className={cn("rounded-md p-1.5 text-brand-navy", FOCUS)}
                aria-label="Close menu"
              >
                <X className="size-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto" onClick={closeMobile}>
              {NAV_ITEMS.map((item) =>
                item.children ? (
                  <div key={item.label} className="py-1">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </p>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm text-brand-navy hover:bg-brand-navy/5",
                          FOCUS,
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    to={item.href ?? "/"}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium text-brand-navy hover:bg-brand-navy/5",
                      FOCUS,
                    )}
                  >
                    {item.label}
                  </Link>
                ),
              )}
              {signedIn ? (
                <div className="mt-4 space-y-2">
                  <Link
                    to="/platform/dashboard"
                    className={cn(
                      "block rounded-md bg-brand-navy px-4 py-2.5 text-center text-sm font-semibold text-white",
                      FOCUS,
                    )}
                  >
                    Go to platform
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={cn(
                      "block w-full rounded-md border border-brand-navy px-4 py-2.5 text-center text-sm font-semibold text-brand-navy",
                      FOCUS,
                    )}
                  >
                    Sign out ({firstName})
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <Link
                    to="/sign-in"
                    className={cn(
                      "block rounded-md border border-brand-navy px-4 py-2.5 text-center text-sm font-semibold text-brand-navy",
                      FOCUS,
                    )}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/sign-up"
                    className={cn(
                      "block rounded-md bg-brand-navy px-4 py-2.5 text-center text-sm font-semibold text-white",
                      FOCUS,
                    )}
                  >
                    Register
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  )
}
