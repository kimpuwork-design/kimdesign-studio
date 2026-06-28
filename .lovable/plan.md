## Goal
Take the whole project (public site + admin + client portal) to a true premium-level finish. Remove what's unused, fix what's half-built, and make every existing feature actually work well.

---

## Phase 1 — Cleanup (remove the noise)

**Public routes & pages**
- Delete `src/pages/public/Projects.tsx` (already redirected; remove the file and its lazy import).
- Delete `src/pages/public/Blog.tsx`, `BlogDetail.tsx` + admin `Blog.tsx`, `BlogEditor.tsx` (zero articles, no usage, dead nav weight). Remove `blog_posts` references in client code only — keep DB intact.
- Delete `src/pages/public/ProjectDetail.tsx` (legacy; PortfolioDetail is canonical).

**Dead components**
- Audit & delete unused: `AnimatedDivider`, `TextScramble`, `SectionIndicator`, `Marquee`, `CustomCursor`, `LiveClock`, `SparklineChart`, `MagneticButton`, `TiltCard` — keep only those actually imported (verify with rg).
- Delete `FloatingChatButton` (Telegram half-build) and its imports project-wide.
- Remove `KMonogramLogo` unused variants.

**Routes cleanup in `App.tsx`**
- Drop blog routes, `/projects/:id`, `/projects` redirect (becomes 404 → /portfolio via NotFound).
- Drop admin blog routes from nav + router.

---

## Phase 2 — Fix broken/half-working features

**Public site**
- **Home**: real hero composition, working featured-projects strip (3 cards from `is_featured=true`), editorial quote, CTA. Compact bento intro stays.
- **Portfolio**: ensure stats counters fire (already fixed) + add working category filter chips + search.
- **Contact**: wire `mailto:`, `tel:`, WhatsApp deep links from `settings`. Embed OpenStreetMap iframe for HQ address. Make the contact form actually insert into `leads` table with toast confirmation.
- **PortfolioDetail**: breadcrumb (Portfolio → category → title), related projects (3 same-category), gallery lightbox already exists — verify it opens.
- **Footer**: real footer with logo, nav, social icons (FB/IG/Behance from settings), contact, copyright.

**Admin dashboard**
- Verify Projects/Clients/Leads/Quotes/Invoices/Files/Deliverables CRUD all work end-to-end (smoke-test with Playwright; fix what crashes).
- Wire AdminSettings save → settings table (verify columns persist).
- Notifications bell: confirm realtime works, mark-as-read works.

**Client portal**
- Verify `/app` dashboard, project list, project detail tabs (messages, files, deliverables, billing) all load with current RLS.
- Fix any 403/empty states from the recent column-grant changes (PortfolioDetail/ProjectDetail style queries).

---

## Phase 3 — Premium polish

- Unified motion: scroll-reveal with project easing `[0.22, 1, 0.36, 1]` on headlines/cards (subtle, no marquees per memory rule).
- Headline treatment: clean static indigo accent word (already shipped); apply consistently to About/Services/Contact heroes.
- Image fallback gradient tiles everywhere thumbnails render (Home, Portfolio, Related).
- Empty-state illustrations for: no projects, no messages, no files, no notifications.
- Loading skeletons everywhere data fetches (replace spinner-only states).
- Light/dark parity check on every public page.

---

## What I will NOT touch
- Database schema, RLS policies, edge functions (recent security migrations stay).
- Locked design tokens (Midnight Indigo, Space Grotesk + Inter, bento layout).
- i18n (en/my/zo all preserved).
- Auth flow.

---

## Execution order
1. Cleanup pass (delete files, rg-verify no broken imports, build green).
2. Public site fixes (Home featured, Contact form/links, Footer, PortfolioDetail polish).
3. Portal smoke-test via Playwright → patch what breaks.
4. Motion + empty-states + skeletons.
5. Final Playwright pass on all 5 public pages + 3 portal entry points; report.

Reply **"go"** to start, or call out anything to drop/add.