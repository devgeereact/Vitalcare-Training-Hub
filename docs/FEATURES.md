# Vitalcare Training Hub — Feature Matrix & Roadmap

Living reconciliation of the full product vision against the current build.
Source templates (Akademi, EduMin) were surveyed for ideas only — their
Bootstrap/Redux/CKEditor/react-table-v7 stack is NOT ported (incompatible with
our Vite + React 19 + TS + Tailwind + shadcn + TanStack + TipTap + Zustand).

**Status legend**
- ✅ Built — exists and verified
- 🟡 Planned — in the original 10-phase plan (phase noted)
- 🆕 New — added to scope from the master vision (was not planned)
- ⏭️ Later — deferred (Phase 2 / post-MVP, architecture-heavy)

**Scope decisions (override CLAUDE.md where the user explicitly instructed):**
- Ecommerce / Stripe / PayPal selling is now IN scope (CLAUDE.md "Stripe disabled" overridden by explicit instruction).
- Roles extended from 4 to 6: `super_admin · admin · manager · trainer · content_editor · learner` (+ `guest` public). Requires `UserRole` type + RLS update.
- SMS / WhatsApp notifications requested (CLAUDE.md disables SMS/Slack) — kept ⏭️ Later pending provider decision.

---

## 1. Authentication & Access Control
| Feature | Status |
|---|---|
| Sign in / sign out | ✅ Built |
| Learner registration | ✅ Built |
| Forgot password flow | ✅ Built |
| Create new password | ✅ Built |
| Google SSO (OAuth) | ✅ Built |
| Error pages (404/500/coming-soon) | ✅ Built |
| Error pages 400/403/503 | 🆕 New |
| OTP code verification | 🆕 New |
| Role-based access (6 roles + guest) | 🟡 Planned (P2) — extend from 4 roles |
| Session management & device tracking | 🆕 New |
| Lock screen | 🆕 New |
| SSO SAML 2.0 | ⏭️ Later |

## 2. Dashboard & Analytics
| Feature | Status |
|---|---|
| Admin overview dashboard | 🟡 Planned (P6a) — replaces demo |
| ApexCharts / Recharts widgets | ✅ Available (libs installed) |
| Sparkline widgets | 🆕 New |
| Revenue & transaction KPIs | 🟡 P6a / 🆕 (revenue needs ecommerce) |
| Enrolment & student-count metrics | 🟡 P6a |
| Recent activity feed / timeline | 🟡 P6a |
| Learning analytics (completions, drop-off, time-on-task) | 🟡 P8c |
| Learner engagement score (AI) | 🆕 New (AI) |
| Real-time virtual session stats | 🟡 P8 |
| Revenue / subscription MRR chart | 🆕 New (ecommerce) |
| Scheduled email reports | 🆕 New |
| Data export (CSV / PDF / XLSX) | 🟡 P8c |

## 3. Learner Management
| Feature | Status |
|---|---|
| Learner list (search/filter/sort/paginate) | 🟡 P6b |
| Add / edit / delete learner | 🟡 P6b |
| Learner detail view | 🟡 P6b |
| User profile page | 🟡 P6b |
| Learning history & transcript | 🟡 P6b |
| Bulk import (CSV/Excel) | 🟡 P6b |
| Learner tags & segments | 🟡 P6b |
| Account self-service portal | 🟡 P6b |
| Wishlist / saved courses | 🆕 New (ecommerce) |
| Cohort / batch management | 🆕 New |
| Group / team learning (manager-tracked) | 🆕 New |
| Learner portfolio & skills profile | 🆕 New |
| Competency framework mapping | 🆕 New |
| Skills gap analysis report | 🆕 New |

## 4. Course & Content Management
| Feature | Status |
|---|---|
| Course list (admin) + grid/list toggle | 🟡 P6c |
| Add / edit course | 🟡 P6c |
| Course overview (learner view) | 🟡 P6c |
| TipTap rich-text description | 🟡 P6c (TipTap, not CKEditor) |
| Drag-and-drop curriculum builder (dnd-kit) | 🟡 P6c |
| Document uploads (PDF/PPT/Word) | 🟡 P6c |
| Video lesson upload (URL) | 🟡 P6c |
| Course versioning & drafts | 🟡 P6c |
| Prerequisites & unlock logic | 🆕 New |
| Course bundles & learning paths | 🆕 New |
| Course reviews & ratings | 🆕 New |
| Course FAQ section | 🆕 New |
| Content library / reusable assets | 🆕 New (Library module) |
| Multi-language content | ⏭️ Later |
| SCORM 1.2/2004 & xAPI | ⏭️ Later (link-only in P6c) |
| H5P interactive content | ⏭️ Later |
| Microlearning modules | ⏭️ Later |
| Branching / adaptive scenarios | ⏭️ Later |
| Video HLS adaptive streaming | ⏭️ Later |

## 5. Virtual & Live Training
| Feature | Status |
|---|---|
| Zoom integration (schedule/launch/track) | 🟡 P7b |
| Session recording + upload | 🟡 P7b |
| Attendance auto-capture from session | 🟡 P7b |
| Post-session survey / feedback | 🆕 New |
| Session replay for absentees | 🆕 New |
| Webinar mgmt & registration | 🆕 New |
| Waiting room / participant controls | ⏭️ Later (Zoom SDK) |
| Google Meet integration | ⏭️ Later |
| Interactive whiteboard / breakout rooms | ⏭️ Later (Zoom SDK) |

## 6. AI-Powered Features
| Feature | Status |
|---|---|
| AI chatbot tutor (Gemini + OpenRouter) | 🟡 P6g |
| AI quiz/assessment generator | 🟡 P6g |
| AI course content/outline generator | 🟡 P6g |
| AI blog / event / message assist (admins) | 🟡 P6g |
| AI personalised learning path | 🆕 New |
| Smart course recommendations | 🆕 New |
| AI engagement anomaly / at-risk alerts | 🆕 New |
| Auto lesson summaries | 🆕 New |
| AI semantic search | ⏭️ Later (embeddings) |

## 7. Assessment & Grading
| Feature | Status |
|---|---|
| Quiz builder (MCQ/T-F/fill/essay) | 🟡 P6d |
| Auto-grade MCQ/T-F | 🟡 P6d |
| Grade book | 🟡 P6d |
| Question bank & randomisation | 🟡 P6d |
| Attempt & time limits | 🟡 P6d |
| Assignment submission portal | 🆕 New |
| Grade book rubrics | 🆕 New |
| Peer review / peer grading | 🆕 New |
| Adaptive / branching assessments | ⏭️ Later |
| Online AI proctoring (face/tab detect) | ⏭️ Later |

## 8. Attendance & Scheduling
| Feature | Status |
|---|---|
| FullCalendar (week/month/agenda) | 🟡 P6e |
| Event sidebar / drawer | 🟡 P6e |
| Attendance register per session | 🟡 P6e |
| QR code check-in (in-person) | 🟡 P6e |
| Auto attendance from virtual | 🟡 P7b |
| Trainer / room scheduling | 🟡 P8a |
| Recurring session templates | 🟡 P6e |
| Calendar sync (Google/Zoom) | 🟡 P7c |
| Session reminders | 🟡 P7a |
| Attendance compliance reports | 🟡 P8c |
| Holidays calendar overlay | 🆕 New |
| Waitlist management | 🆕 New |

## 9. Certificates & Compliance
| Feature | Status |
|---|---|
| Certificate list (admin) | 🟡 P6f |
| Drag-and-drop cert builder | 🟡 P6f |
| Auto-issue on completion | 🟡 P6f |
| Public verification portal (UUID/QR) | ✅ Built (page) / 🟡 wire data |
| LinkedIn share | 🟡 P6f |
| Open Badges 3.0 digital badge | 🟡 P6f |
| CPD/CEU credit tracking | 🆕 New |
| Cert expiry & renewal alerts | 🆕 New |
| Compliance training tracking | 🟡 P8c |
| Bulk certificate generation | 🆕 New |

## 10. Payments & Billing  +  Ecommerce / Shop 🆕
| Feature | Status |
|---|---|
| Transaction list | 🟡 P6/P8d |
| Invoice generation (jsPDF) | 🟡 P8d |
| **Course storefront / catalogue (sellable)** | 🆕 New |
| **Product grid + list views** | 🆕 New |
| **Course detail / sales page** | 🆕 New |
| **Cart & checkout** | 🆕 New |
| **Stripe integration** | 🆕 New (overrides CLAUDE.md disable) |
| **PayPal integration** | 🆕 New |
| Fees collection + printable receipt | 🆕 New |
| Coupon / promo code engine | 🆕 New |
| Subscription / recurring billing | 🆕 New |
| Multi-currency | 🆕 New |
| Instalment / deferred payment | ⏭️ Later |
| Corporate / B2B bulk invoicing | 🆕 New |
| Refund management workflow | 🆕 New |
| Instructor revenue sharing | ⏭️ Later |
| Tax / VAT config | 🆕 New |
| Revenue & MRR reports | 🆕 New |

## 11. Communication & Collaboration
| Feature | Status |
|---|---|
| Notification bell & panel | ✅ Built (header) / 🟡 wire data P8b |
| In-app chat (Realtime) | 🟡 P8b |
| Direct messaging (learner↔trainer) | 🟡 P8b |
| Announcements / broadcast | 🟡 P8b |
| Email module / campaigns (Resend) | 🟡 P7a/P8b |
| Email template manager | 🆕 New |
| Discussion forums per course | 🆕 New |
| Trainer–learner Q&A wall | 🆕 New |
| Learner feedback & NPS survey | 🆕 New |
| Push notifications (PWA) | 🟡 P9 |
| SMS / WhatsApp | ⏭️ Later (CLAUDE.md disables) |

## 12. Trainer / Instructor Management
| Feature | Status |
|---|---|
| Trainer profile & bio | 🟡 P8a |
| Trainer course portfolio | 🟡 P8a |
| Availability calendar | 🟡 P8a |
| Performance analytics | 🟡 P8a |
| Co-instructor / assistant support | 🆕 New |
| Trainer rating & review | 🆕 New |
| Payout / revenue dashboard | 🆕 New (ecommerce) |
| Trainer onboarding workflow | 🆕 New |

## 13. Admin, Settings & Platform
| Feature | Status |
|---|---|
| Settings — general | 🟡 P8d |
| Notification preferences | 🟡 P8d |
| Language / locale | 🟡 P8d |
| Password & security settings | 🟡 P8d |
| Custom colour themes | ✅ 4 built (vision: 15) |
| Layout modes (vertical/horizontal/compact) | 🆕 New |
| Responsive mobile/tablet/desktop | ✅ Built |
| Audit log & compliance trail | 🟡 P8d |
| Link external accounts | 🟡 P8d |
| State management | ✅ Zustand + TanStack Query |
| PWA install / offline | 🟡 P9 |
| WCAG 2.1 AA | 🟡 P10 |
| GDPR / data privacy controls | 🟡 P8d |
| Departments (org sub-units) | 🆕 New (table exists) |
| Staff management | 🆕 New |
| REST API + webhooks | ⏭️ Later |
| Multi-tenant / white-label + custom domain | ⏭️ Later |
| HRM / ATS integration | ⏭️ Later |
| Automated backup & restore | ⏭️ Later |

---

## New modules added to navigation skeleton (build during Phase 6+)
- **Store** (ecommerce): Catalogue, Product detail, Cart, Checkout, Orders, Coupons
- **Departments** (under Organisation)
- **Library** / Content assets (under Learning)
- **Cohorts & Teams** (under People)
- **Forums** (under Communication)
- **Holidays** (under Attendance)
- **Fees & Receipts** (under Payments)

Unbuilt routes render the branded `ModuleComingSoon` notice until their phase.
