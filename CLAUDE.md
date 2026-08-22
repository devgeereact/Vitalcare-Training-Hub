# CLAUDE.md — Vitalcare Training Hub
# Framework: TIDD-EC + Authority Persuasion
# Skills: superpowers + taste-skill + impeccable + ui-ux-pro-max + vitalcare-branding-os
# Version: 3.0.0 | UK English | No em-dashes | No AI slop

---

## MANDATORY SESSION START

**READ THIS FILE COMPLETELY BEFORE WRITING ANY CODE.**

After reading, state: **"CLAUDE.md loaded. Ready to proceed."**

Skipping this causes brand drift, architectural errors, and copy that fails the voice enforcer. Every time.

---

## PRODUCT IDENTITY

| Field | Value |
|-------|-------|
| **App name** | Vitalcare Training Hub |
| **Company** | Vitalcare Training Hub Ltd |
| **Company number** | 15718997 (England and Wales) |
| **Website** | vitalcare.uk |
| **Address** | 11 Halesworth Road, London SE13 7TJ |
| **Phone** | 020 8059 8757 |
| **Email** | info@vitalcare.uk |
| **Admin email** | gakinz101@gmail.com |
| **Secondary admin** | info@vitalcare.uk |
| **Repo** | github.com/devgeereact/Vitalcare-Training-Hub |
| **Deploy** | cPanel (Apache/LiteSpeed) at vitalcare.uk, `npm run deploy` |
| **Supabase project** | mongirnapzzizmzcrkqp |
| **Founded** | May 2024 |
| **NHS framework** | CSTF-aligned |
| **Accreditation** | CPD-accredited |

---

## LEADERSHIP

| Person | Role | Email |
|--------|------|-------|
| Gideon Akinlotan | Founder & CEO | gideon@vitalcare.uk |
| Harni Muharami RN MSc | Co-Founder & Clinical Director | harni@vitalcare.uk |

**Certificate sign-off (exact wording, always):**
> Overseen by Harni Muharami RN MSc, Clinical Director

---

## ARCHITECTURE

This is a **Vite + React 19 Single Page Application (SPA)** — NOT Next.js.

```
vitalcare.uk/              → Public marketing website (React Router, no auth)
vitalcare.uk/platform/*   → Authenticated TMS platform (Supabase auth guard)
```

Both use the **same Vite SPA**, React Router DOM v7 handles all routing.

**Base template:** `pulse-ui-react` (Vite + React 19 + TypeScript + Shadcn/ui + Tailwind)
This template was forked and rebranded. Do NOT overwrite its core components unnecessarily.

---

## TECH STACK — FREE TIER ONLY

| Layer | Technology | Limit / Notes |
|-------|-----------|--------------|
| Framework | Vite 7 + React 19 | SPA — no SSR |
| Language | TypeScript 5 strict | Zero `any`. No exceptions. |
| Routing | React Router DOM v7 | No Next.js routing |
| Styling | Tailwind CSS 3 | Utility-first |
| Components | Shadcn/ui (Radix UI) | Do not edit files in src/components/ui/ |
| Icons | Lucide React + Tabler Icons | Both available from pulse-ui-react |
| Charts | ApexCharts (platform) | For dashboard and analytics |
| Calendar | FullCalendar 6 | Sessions and scheduling |
| Forms | React Hook Form + Zod | Every form, always |
| Rich text | TipTap (course builder) | From pulse-ui-react |
| Tables | TanStack Table v8 | Sortable, filterable, paginated |
| Drag & drop | In built in pulse-ui or dnd-kit | Curriculum builder |
| State (client) | Zustand | UI state only |
| State (server) | TanStack Query v5 | Server data fetching |
| Animations | Framer Motion | transform + opacity ONLY |
| PDF | jsPDF + jspdf-autotable | Certificates + reports |
| CSV/XLSX | PapaParse (parse) + xlsx (export) | Import/export |
| Auth | Supabase Auth | SSR via @supabase/ssr |
| Database | Supabase PostgreSQL | 500MB free |
| Storage | Supabase Storage | 1GB free |
| Realtime | Supabase Realtime | Notifications, chat |
| Deploy | cPanel static hosting | Local build, rsync over SSH. Server has no Node |
| CI | GitHub Actions | Unlimited: the repo is public. CodeQL runs too |
| Email | Resend | 3,000/month |
| AI (primary) | Gemini 3.6 Flash | Requires credit on the geeapp-n8n project |
| AI (fallback) | OpenRouter Claude Haiku | Via Supabase Edge Function |
| Video | Zoom Server-to-Server OAuth | Virtual sessions |
| Calendar sync | Google Calendar API | Session scheduling |
| Weather | OpenWeather | Dashboard widget |

**STRIPE DISABLED** — Phase 2 only. Never build Stripe integration unless explicitly instructed.
**SLACK DISABLED** — `SLACK_ENABLED=false`. Never use Slack webhook.

---

## BRAND PALETTE

Extracted from official Vitalcare SVG logos:

```css
/* Primary brand */
--brand-navy:       #1b2e6b;  /* Sidebar, headers, primary buttons */
--brand-gold:       #d4a843;  /* Accents, CTAs, badges, cert borders */
--brand-navy-dark:  #142054;  /* Hover state for navy elements */
--brand-gold-light: #e8c26a;  /* Hover state for gold elements */

/* Application */
--background:  #f8fafc;  /* slate-50 — app background */
--foreground:  #0f172a;  /* slate-900 — body text */
--muted:       #f1f5f9;  /* slate-100 */
--muted-fg:    #64748b;  /* slate-500 */
--border:      #e2e8f0;  /* slate-200 */

/* Semantic */
--success:     #16a34a;  /* emerald-600 — CSTF/CPD badges */
--warning:     #d97706;  /* amber-600 */
--destructive: #dc2626;  /* red-600 */
```

**Tailwind config additions (tailwind.config.ts):**
```typescript
extend: {
  colors: {
    brand: {
      navy: '#1b2e6b',
      'navy-dark': '#142054',
      gold: '#d4a843',
      'gold-light': '#e8c26a',
    }
  },
  fontFamily: {
    display: ['"DM Serif Display"', 'serif'],
    sans: ['"DM Sans"', 'sans-serif'],
  }
}
```

---

## OFFICIAL LOGOS

Four official SVG logos are in `public/logos/`. NEVER recreate, approximate, or modify them.

| File | Usage |
|------|-------|
| `logo-horizontal-navy.svg` | Marketing site header, documents, footers on white |
| `logo-horizontal-white.svg` | Auth pages left panel, navy backgrounds |
| `logo-round-navy.svg` | Favicon, app icon, og:image |
| `logo-round-white.svg` | Sidebar (collapsed state icon), dark backgrounds |

**In code:**
```tsx
<img src="/logos/logo-horizontal-white.svg" alt="Vitalcare Training Hub" width={240} height={60} />
```

---

## FILE STRUCTURE

```
vitalcare-training-hub/
├── src/
│   ├── app/
│   │   └── router.tsx                    # React Router config (all routes)
│   ├── auth/                             # Auth pages (from pulse-ui-react, rebranded)
│   │   ├── cover/
│   │   │   ├── CoverLoginPage.tsx
│   │   │   ├── CoverRegisterPage.tsx
│   │   │   ├── CoverForgotPasswordPage.tsx
│   │   │   └── CoverResetPasswordPage.tsx
│   │   └── callback.tsx                  # OAuth callback
│   ├── pages/
│   │   ├── marketing/                    # Public website pages
│   │   │   ├── HomePage.tsx
│   │   │   ├── AboutUsPage.tsx
│   │   │   ├── OurCoursesPage.tsx
│   │   │   ├── CategoryPage.tsx          # /our-courses/:slug
│   │   │   ├── TrainingSolutionPage.tsx  # /training-solutions/:sector
│   │   │   ├── VerifyCertPage.tsx
│   │   │   ├── AccreditationsPage.tsx
│   │   │   ├── BlogPage.tsx
│   │   │   ├── EventsPage.tsx
│   │   │   ├── ContactPage.tsx
│   │   │   └── legal/                   # FAQ, Privacy, etc.
│   │   └── platform/                    # Authenticated TMS pages
│   │       ├── DashboardPage.tsx
│   │       ├── courses/
│   │       ├── learners/
│   │       ├── assessments/
│   │       ├── sessions/
│   │       ├── attendance/
│   │       ├── calendar/
│   │       ├── certificates/
│   │       ├── trainers/
│   │       ├── messages/
│   │       ├── announcements/
│   │       ├── notifications/
│   │       ├── virtual/
│   │       ├── ai/
│   │       ├── analytics/
│   │       ├── payments/
│   │       ├── audit/
│   │       └── settings/
│   ├── layouts/
│   │   ├── AppLayout.tsx                # Platform shell (sidebar + header) — REBRANDED
│   │   ├── MarketingLayout.tsx          # Marketing shell (nav + footer)
│   │   └── AuthLayout.tsx              # Auth shell (split-screen)
│   ├── components/
│   │   ├── marketing/                  # Landing page components
│   │   │   ├── Nav.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── StatsBar.tsx
│   │   │   ├── TrustBadges.tsx
│   │   │   ├── CourseGrid.tsx
│   │   │   └── SectorCard.tsx
│   │   ├── platform/                   # Platform shell components
│   │   │   ├── VitalcareSidebar.tsx    # REPLACES app-sidebar.tsx
│   │   │   ├── PlatformHeader.tsx      # REPLACES header in AppLayout
│   │   │   └── BottomTabBar.tsx        # Mobile-only platform nav
│   │   ├── [module]/                   # One folder per TMS module
│   │   └── ui/                         # Shadcn — DO NOT EDIT
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── guards/
│   │   ├── AuthGuard.tsx
│   │   └── RoleGuard.tsx
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-user.ts
│   │   └── use-[module].ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)
│   │   │   └── auth.ts
│   │   ├── integrations/
│   │   │   ├── zoom.ts
│   │   │   ├── google-calendar.ts
│   │   │   └── weather.ts
│   │   ├── ai/
│   │   │   ├── gemini.ts
│   │   │   └── openrouter.ts
│   │   ├── email/
│   │   │   ├── welcome.ts
│   │   │   ├── certificate.ts
│   │   │   ├── session-reminder.ts
│   │   │   └── contact-form.ts
│   │   ├── queries/                    # TanStack Query hooks
│   │   │   └── [module].queries.ts
│   │   ├── validations/                # Zod schemas
│   │   │   └── [module].schema.ts
│   │   ├── constants.ts
│   │   └── utils.ts                   # cn(), formatDate(), etc.
│   ├── store/
│   │   ├── ui-theme.store.ts           # From pulse-ui-react — add Vitalcare themes
│   │   └── auth.store.ts
│   ├── data/
│   │   ├── courses.ts                  # 190+ courses, 15 categories
│   │   ├── sectors.ts                  # 5 training solutions sectors
│   │   └── nav.ts                      # NAV_ITEMS constant
│   ├── types/
│   │   ├── database.types.ts
│   │   └── index.ts
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql
│   │   ├── 002_rls.sql
│   │   └── 003_seed.sql
│   └── rls_policies.sql
├── public/
│   ├── logos/
│   │   ├── logo-horizontal-navy.svg
│   │   ├── logo-horizontal-white.svg
│   │   ├── logo-round-navy.svg
│   │   └── logo-round-white.svg
│   └── favicon.ico                     # Use logo-round-navy.svg
├── .github/workflows/ci.yml
├── .env.example                        # Committed — template only
├── .env.local                          # Real keys — NEVER commit
├── .gitignore
├── vite.config.ts                      # base: "/" (not /pulse-ui/)
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── package.json
├── public/.htaccess                    # SPA rewrites + cache headers (Apache)
├── index.html                          # Vitalcare title + Google Fonts
├── CLAUDE.md                           # You are here
└── tms-product-spec-2026.html          # Feature spec reference
```

---

## SUPABASE CLIENT

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'vitalcare-auth',
    autoRefreshToken: true,
  }
})
```

**CRITICAL:** `SUPABASE_SERVICE_ROLE_KEY` is NEVER used in the browser. Use only in Supabase Edge Functions.

---

## USER ROLES

```typescript
type UserRole = 'super_admin' | 'admin' | 'trainer' | 'learner'
```

| Role | Access |
|------|--------|
| super_admin | Full platform + all organisations. Gideon only. |
| admin | Full access within their organisation. |
| trainer | Own courses, sessions, assessments. |
| learner | Enrol, learn, take assessments, download own certificates. |

**Route protection:**
```
/platform/*                  Any authenticated user
/platform/learners/*         admin, super_admin
/platform/trainers/*         admin, super_admin
/platform/settings/*         admin, super_admin
/platform/payments/*         admin, super_admin
/platform/audit/*            super_admin only
/platform/analytics/*        admin, super_admin, trainer (own data)
/platform/courses/builder    admin, super_admin, trainer
```

---

## DEV ACCOUNT

```
Email:    gideon@vitalcare.uk
Password: Testing123!
Role:     super_admin
```

For local development only. Seeded via `supabase/migrations/003_seed.sql`.

---

## ENVIRONMENT VARIABLES

### Variable rules:
- `VITE_*` — exposed to browser. Use ONLY for Supabase URL + anon key + public flags.
- All API secrets (Zoom, Google AI, OpenRouter, Resend, Google OAuth) — server-side only via Supabase Edge Functions.
- `.env.local` is in `.gitignore`. It is NEVER committed.
- The production bundle is built locally, so `.env.local` supplies the build. There is no hosting dashboard to paste variables into.

### Supabase client config:
```
VITE_SUPABASE_URL=https://mongirnapzzizmzcrkqp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_VmCIonQ2-mXxEgHrtXEIaw_wKWt4fEd
```

---

## COURSE CATALOGUE

15 categories, 190+ courses. Static data in `src/data/courses.ts`.

```typescript
export const COURSE_CATEGORIES = [
  { id: '01', slug: 'mandatory-care',         name: 'Mandatory Care',                      count: 14 },
  { id: '02', slug: 'care-skills',            name: 'Care Skills',                         count: 17 },
  { id: '03', slug: 'safeguarding',           name: 'Safeguarding',                        count: 19 },
  { id: '04', slug: 'clinical-care',          name: 'Clinical Care',                       count: 20 },
  { id: '05', slug: 'specialist-care',        name: 'Specialist Care',                     count: 16 },
  { id: '06', slug: 'mental-health',          name: 'Mental Health',                       count: 6  },
  { id: '07', slug: 'health-safety-essentials',  name: 'Health and Safety Essentials',     count: 14 },
  { id: '08', slug: 'health-safety-trainer',  name: 'Health and Safety Train the Trainer', count: 15 },
  { id: '09', slug: 'care-trainer',           name: 'Care Train the Trainer',              count: 20 },
  { id: '10', slug: 'first-aid',              name: 'First Aid',                           count: 9  },
  { id: '11', slug: 'business-compliance',    name: 'Business Compliance',                 count: 9  },
  { id: '12', slug: 'soft-skills',            name: 'Soft Skills',                         count: 9  },
  { id: '13', slug: 'fire-safety',            name: 'Fire Safety',                         count: 2  },
  { id: '14', slug: 'food-safety',            name: 'Food Safety',                         count: 4  },
  { id: '15', slug: 'education-essentials',   name: 'Education Essentials',                count: 16 },
] as const
```

---

## DESIGN SYSTEM RULES

### Typography
- Display/H1/H2: `font-display` (DM Serif Display) — weight 400 only
- H3–H6, labels, UI: `font-sans` (DM Sans) — weight 400/500/600/700
- Body text: `font-sans text-base leading-relaxed` (16px, 1.625 line-height)
- Cap line length at 65ch for long-form text

### Spacing
Standard Tailwind spacing scale. Never use arbitrary values without justification.

### Animations
```typescript
// ALLOWED: transform + opacity
{ opacity: 0, y: 20 } → { opacity: 1, y: 0 }

// BANNED: width, height, top, left, right, bottom
// ALWAYS: respect prefers-reduced-motion
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

### Focus ring (Apple HIG compliance)
```css
/* Apply to ALL interactive elements */
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2
```

### Component requirements (every data-fetching component)
1. Loading state: Shadcn Skeleton (not spinner)
2. Empty state: illustration + heading + optional CTA
3. Error state: error message + retry button

---

## CODING STANDARDS

### TypeScript
```typescript
// Explicit return types on all exported functions
export async function getCourse(id: string): Promise<Course | null> { }

// Zod for all external input
const schema = z.object({ email: z.string().email(), name: z.string().min(2) })

// Supabase query pattern
const { data, error } = await supabase.from('courses').select('*').eq('id', id).single()
if (error) { console.error('[getCourse]', error); return null }
return data

// Never: any
// Never: type assertions without justification + comment
```

### TanStack Query pattern (all data fetching)
```typescript
// src/lib/queries/courses.queries.ts
export const coursesKeys = {
  all: ['courses'] as const,
  list: (filters?: CourseFilters) => [...coursesKeys.all, 'list', filters] as const,
  detail: (id: string) => [...coursesKeys.all, 'detail', id] as const,
}

export function useCourses(filters?: CourseFilters) {
  return useQuery({
    queryKey: coursesKeys.list(filters),
    queryFn: () => getCourses(filters),
    staleTime: 5 * 60 * 1000,
  })
}
```

### Error handling
```typescript
// Every async operation: try/catch or Supabase { data, error }
// User-facing: plain English ("Failed to load courses. Please try again.")
// Technical: console.error('[functionName]', error) — server only
// Never: empty catch blocks
// Never: expose stack traces to users
```

---

## BRAND VOICE (vitalcare-branding-os:voice-enforcer)

Applied to ALL user-facing text: headings, labels, error messages, emails, notifications, tooltips, placeholder text.

### The Four-Word Standard
Every piece of Vitalcare copy must be: **Authoritative. Approachable. Evidence-led. Human.**

### UK English always
organisation, programme, practise (verb), practice (noun), centre, colour, licence (noun), license (verb)

### Banned words (zero tolerance)
`delve` `tapestry` `testament` `showcase` (verb) `pivotal` `synergy` `seamless` `leverage` (verb) `holistic` `game-changer` `transformative` `innovative` (unsupported) `unique` (unsupported) `comprehensive` (filler) `bespoke` (overused) `streamline` `facilitate` `empower` `world-class`

### Healthcare clichés (banned)
"passionate about patient care" "committed to excellence" "going the extra mile" "making a difference" (hollow) "dedicated team of professionals"

### Structural bans
- Em-dashes — never. Use commas, colons, brackets, or restructure.
- Rule of three padding where all three say the same thing
- Hollow openers: "Certainly!", "Of course!", "I'd be happy to", "Great question!"

### Standard credentialing phrase (use on external pages)
> "CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify"

---

## GIT & DEPLOYMENT

### Branches
```
production → live site at vitalcare.uk (deployed by hand, see below)
dev        → default working branch
feature/*  → PRs into dev
hotfix/*   → emergency PRs into production
```

`production` is the repo default branch on GitHub. There is no `main`.

### Commit format
```
type(scope): description
feat(courses): add CSTF-aligned flag to course builder
fix(auth): resolve Google OAuth redirect loop on mobile
chore(deps): update vite to 7.2.5
```

### Deploying

There is no auto-deploy. A push to `production` does not reach the live site.
The server has no Node, so the build runs locally and ships as static files:

```bash
npm run deploy:check    # dry run — prints every file rsync would change
npm run deploy          # build, then rsync to vitalcare.uk
```

Both wrap `cpanel-deploy` (see `~/CLAUDE.md` §2). Run `deploy:check` first: the
target `vitalcare.uk` is an addon-domain root, and a mirror deploy deletes
anything on the server that is absent locally.

### SPA routing

`public/.htaccess` owns it, not `vercel.json`. React Router takes every path
that is not a real file, except missing build artefacts under `/assets/` and
friends, which must 404 so `src/lib/chunk-reload.ts` sees a load error rather
than an HTML body with a 200. `cpanel-deploy` skips `.htaccess` unless the
deploy passes `--with-htaccess`, which the npm scripts do.

---

## 13-MODULE REFERENCE

| # | Module | Platform Route | Priority |
|---|--------|---------------|----------|
| 01 | Auth & Access Control | /sign-in, /sign-up | P0 |
| 02 | Dashboard & Analytics | /platform/dashboard | P0 |
| 03 | Learner Management | /platform/learners | P0 |
| 04 | Course & Content | /platform/courses | P0 |
| 05 | Virtual & Live Training | /platform/virtual | P1 |
| 06 | AI-Powered Features | /platform/ai | P1 |
| 07 | Assessment & Grading | /platform/assessments | P0 |
| 08 | Attendance & Scheduling | /platform/sessions + /platform/calendar | P0 |
| 09 | Certificates & Compliance | /platform/certificates | P0 |
| 10 | Payments & Billing | /platform/payments | P1 |
| 11 | Communication | /platform/messages + /platform/announcements | P1 |
| 12 | Trainer Management | /platform/trainers | P1 |
| 13 | Admin & Settings | /platform/settings | P0 |

Full acceptance criteria: see `tms-product-spec-2026.html`

---

## HARD RULES

These are absolute. Breaking them causes security holes, brand violations, or architectural debt.

```
RULE 01  READ CLAUDE.md at the start of every session.
         State "CLAUDE.md loaded. Ready to proceed." before writing any code.

RULE 02  NEVER commit .env.local or any file containing real API keys.

RULE 03  NEVER disable Row Level Security on any Supabase table.

RULE 04  NEVER expose SUPABASE_SERVICE_ROLE_KEY, ZOOM_CLIENT_SECRET,
         GOOGLE_AI_API_KEY, OPENROUTER_API_KEY, or RESEND_API_KEY to the browser.
         These are server-only. Use Supabase Edge Functions for server-side calls.

RULE 05  NEVER use NEXT_PUBLIC_ prefix. This is Vite — use VITE_ prefix.

RULE 06  NEVER scaffold from scratch. Fork and extend pulse-ui-react.

RULE 07  NEVER recreate, approximate, or modify the official SVG logos.
         Use only the files in public/logos/.

RULE 08  NEVER use the Inter font. Use DM Sans (body) + DM Serif Display (headings).

RULE 09  NEVER use em-dashes in user-facing copy. Use commas, colons, or restructure.

RULE 10  NEVER use banned brand words (see voice enforcer section).

RULE 11  NEVER write American English in user-facing text.

RULE 12  NEVER animate width, height, top, left. Animate transform + opacity only.

RULE 13  NEVER build a component without its loading, empty, and error states.

RULE 14  NEVER expose API secrets to the browser (only VITE_SUPABASE_URL +
         VITE_SUPABASE_PUBLISHABLE_KEY are safe for browser exposure).

RULE 15  NEVER use `any` as a TypeScript type.

RULE 16  NEVER leave empty catch blocks. Log the error at minimum.

RULE 17  NEVER merge to production without passing CI (secret scan + typecheck
         + lint + build).

RULE 18  ALWAYS test at 375px mobile breakpoint before committing UI changes.

RULE 19  ALWAYS run npm run typecheck && npm run lint before committing.

RULE 20  ALWAYS run the vitalcare voice enforcer on any user-facing copy before shipping.
```

---

## WORKING AGREEMENT

We are building Vitalcare Training Hub for a real healthcare training company.

- Say so before writing code if you see a structural problem.
- Flag conflicts with this CLAUDE.md before proceeding.
- Every commit is a working, testable unit.
- Ask one specific question rather than guessing at ambiguous requirements.
- Build for NHS training managers and clinical staff. Nothing ships unless it works and earns their trust.

---

*Vitalcare Training Hub Ltd | Company No. 15718997 | vitalcare.uk*
*CLAUDE.md v3.0.0 | Review: per major phase completion*
