import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ChevronDown, Menu, X, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react"
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

const VERIFY_HREF = "/resources/verify-certificate"

/** Is the given href the active route (exact for home, prefix otherwise). */
function isActive(pathname: string, href?: string): boolean {
  if (!href || href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { session, profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

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

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (mobileOpen) {
      const previous = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = previous
      }
    }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-shadow duration-200",
        scrolled
          ? "border-b border-brand-navy/10 bg-white/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/80"
          : "border-b border-transparent bg-white/80 backdrop-blur-sm supports-[backdrop-filter]:bg-white/60",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className={cn("flex items-center rounded-md", FOCUS)}
          aria-label="Vitalcare Training Hub home"
        >
          <img
            src="/logos/logo-horizontal-navy.svg"
            alt="Vitalcare Training Hub"
            className="h-9 w-auto"
            width={180}
            height={36}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger
                  className={cn(
                    "group inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-brand-navy/70 transition-colors hover:text-brand-navy data-[state=open]:text-brand-navy",
                    FOCUS,
                  )}
                >
                  {item.label}
                  <ChevronDown className="size-4 text-brand-navy/50 transition-transform group-data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
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
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand-gold after:transition-transform after:duration-200",
                  isActive(pathname, item.href)
                    ? "text-brand-navy after:scale-x-100"
                    : "text-brand-navy/70 hover:text-brand-navy after:scale-x-0 hover:after:scale-x-100",
                  FOCUS,
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to={VERIFY_HREF}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-brand-navy/80 transition-colors hover:text-brand-navy",
              FOCUS,
            )}
          >
            <ShieldCheck className="size-4 text-brand-gold" aria-hidden="true" />
            Verify certificate
          </Link>

          <span className="mx-1 h-5 w-px bg-brand-navy/10" aria-hidden="true" />

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
                  "inline-flex items-center rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-navy-dark",
                  FOCUS,
                )}
              >
                Get started
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
          aria-expanded={mobileOpen}
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
            className="absolute inset-0 bg-brand-navy/50 motion-safe:animate-in motion-safe:fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85%] flex-col bg-white shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-right">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <img
                src="/logos/logo-horizontal-navy.svg"
                alt="Vitalcare Training Hub"
                className="h-8 w-auto"
                width={160}
                height={32}
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className={cn("rounded-md p-1.5 text-brand-navy hover:bg-brand-navy/5", FOCUS)}
                aria-label="Close menu"
              >
                <X className="size-6" />
              </button>
            </div>
            <nav
              className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-4 py-4"
              onClick={closeMobile}
            >
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
                          "block rounded-md px-3 py-2 text-sm text-brand-navy/90 transition-colors hover:bg-brand-navy/5",
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
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive(pathname, item.href)
                        ? "bg-brand-navy/5 text-brand-navy"
                        : "text-brand-navy/90 hover:bg-brand-navy/5",
                      FOCUS,
                    )}
                  >
                    {item.label}
                  </Link>
                ),
              )}

              <Link
                to={VERIFY_HREF}
                className={cn(
                  "mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-navy/90 transition-colors hover:bg-brand-navy/5",
                  FOCUS,
                )}
              >
                <ShieldCheck className="size-4 text-brand-gold" aria-hidden="true" />
                Verify certificate
              </Link>
            </nav>

            <div className="border-t border-border px-6 py-5">
              {signedIn ? (
                <div className="space-y-2">
                  <Link
                    to="/platform/dashboard"
                    onClick={closeMobile}
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
                <div className="space-y-2">
                  <Link
                    to="/sign-up"
                    onClick={closeMobile}
                    className={cn(
                      "block rounded-md bg-brand-navy px-4 py-2.5 text-center text-sm font-semibold text-white",
                      FOCUS,
                    )}
                  >
                    Get started
                  </Link>
                  <Link
                    to="/sign-in"
                    onClick={closeMobile}
                    className={cn(
                      "block rounded-md border border-brand-navy px-4 py-2.5 text-center text-sm font-semibold text-brand-navy",
                      FOCUS,
                    )}
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
