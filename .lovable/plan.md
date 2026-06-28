A staged refactor + optimization roadmap for the whole project. Each step is independently shippable and reversible. Order is "biggest payoff first, riskiest last."

---

## Step 1 — Dead-code & dependency audit (low risk, instant wins)

**Goal:** shrink bundle, drop maintenance surface.

- Run `bunx knip` and `bunx depcheck` → list truly unused exports, files, deps.
- Remove unused shadcn primitives never imported (audit `src/components/ui/*`).
- Drop unused npm deps from `package.json`.
- Delete unused i18n keys (blog_* etc.) from `src/i18n/en.ts | my.ts | zo.ts | types.ts`.
- Strip leftover console.logs and dev-only code.

**Exit criteria:** `bun run build` size drops; `tsgo --noEmit` green.

---

## Step 2 — Data layer consolidation

**Goal:** stop duplicated Supabase fetches scattered across components.

- Introduce TanStack Query everywhere (already installed but barely used). One hook per resource: `useProjects`, `useProject(id)`, `useSettings`, `useSiteContent`, `useLeads`, `useDeliverables`, `useInvoices`, etc.
- Centralize select-column lists in `src/lib/queries/*.ts` so column-grant restrictions live in one place (avoids future `select("*")` regressions).
- Add a thin `supabaseFetch` wrapper that normalizes errors, returns `null` instead of throwing, logs via `console.warn` only in dev.
- Replace all remaining `.single()` on read paths with `.maybeSingle()`; keep `.single()` only after `insert().select()`.
- Standardize realtime subscriptions through a `useRealtimeRows(table, filter)` hook.

**Exit criteria:** no direct `supabase.from(...)` calls inside `pages/` or `components/` — only inside hooks.

---

## Step 3 — Route & code-split optimization

**Goal:** faster first paint, fewer chunk-loads.

- Group public route chunks under one prefetch boundary (Home prefetches Portfolio + Contact on idle).
- Move heavy admin-only deps (charts, PDF, kanban DnD) behind dynamic `import()` inside the admin route only.
- Remove duplicate lazy components left from cleanup; verify no stale routes in `App.tsx`.
- Add `<link rel="preload">` for the LCP hero image in `index.html`, plus `fetchpriority="high"` on the Home hero `<img>`.

**Exit criteria:** Lighthouse LCP < 2.5 s on Home; initial JS payload reduced.

---

## Step 4 — Image & media pipeline

**Goal:** end the broken-thumbnail era; cut image weight by ~60 %.

- Add `vite-imagetools` and import all bundled hero/profile assets as `?format=avif&format=webp&as=picture`.
- Wrap every `<img>` of user-uploaded content with a shared `<SmartImage>` component: lazy by default, `decoding="async"`, branded gradient fallback on error (already partially shipped — make it the single source of truth).
- For Supabase Storage portfolio images, request width-resized URLs (`render/image/public/...?width=...&resize=cover`) instead of raw originals.
- Convert `public/` static assets via `squoosh-cli` once and commit smaller files.

**Exit criteria:** no broken-image icons anywhere; total image transfer on Home + Portfolio < 800 KB.

---

## Step 5 — Component & design-system refactor

**Goal:** stop copy-pasting hero/section/card patterns across pages.

- Extract reusable primitives that already exist in fragments:
  - `<Hero variant="public" eyebrow title accentWord description bgImage />`
  - `<SectionHeader eyebrow title lead />`
  - `<ProjectCard size="sm|md|lg" />`
  - `<EmptyState icon title body action />`
  - `<DataTableShell loading empty error>` for admin tables.
- Replace the duplicated motion blocks in `Home / About / Services / Contact` heroes with a single `<HeroHeadline />`.
- Audit `index.css` — remove unused custom classes (`hero-shimmer-text` was replaced; verify no orphans). Consolidate token usage; ban any hard-coded colors (lint rule).

**Exit criteria:** each public page < 250 lines; no JSX duplicated across ≥ 3 files.

---

## Step 6 — Forms & validation

**Goal:** consistent, accessible, secure forms.

- Move every form to `react-hook-form` + `zod` resolver (Contact already partial; admin modals still ad-hoc).
- One `<FormField>` wrapper handling label, error, focus underline animation.
- Server-side rate-limit `leads` insert via an edge function (replace the current 30 s client-side guard).
- Add honeypot field on Contact form.

**Exit criteria:** zero `useState` form state in pages; all submit handlers go through `zodResolver`.

---

## Step 7 — Auth, roles & RLS hardening

**Goal:** match the project memory rule "roles in separate table."

- Migrate `profiles.role` → dedicated `user_roles(user_id, role app_role)` table with `has_role(uuid, app_role)` SECURITY DEFINER (already exists but reads from `profiles`).
- Re-point every RLS policy to the new `has_role` function.
- Re-audit grants on every public-schema table: `authenticated` only unless explicitly public; `anon` column-grants only for safe metadata (already done for `projects`, `settings`, `file_assets` — extend to `portfolio_items`, `portfolio_gallery`, `site_content`).
- Add a CI step that runs `supabase--linter` and fails on critical findings.

**Exit criteria:** security scan shows zero critical/high findings; role checks never query `profiles.role` from client.

---

## Step 8 — Database performance

**Goal:** sub-100 ms p95 on listing queries.

- Run `supabase--slow_queries` → take top 10.
- Add indexes:
  - `projects (is_public, is_featured, created_at desc)`
  - `file_assets (project_id, is_deleted)`
  - `deliverables (project_id, status)`
  - `notifications (user_id, read_at)`
  - `messages (project_id, created_at desc)`
- Replace `select("*", { count: "exact" })` head-count calls with materialized counters where stats are shown (Home, Portfolio, Dashboard).
- Add pagination to `/admin/leads`, `/admin/invoices`, `/admin/files` (currently unlimited fetch).

**Exit criteria:** EXPLAIN ANALYZE shows index scans on hot paths; dashboard load < 600 ms.

---

## Step 9 — Realtime & notifications

**Goal:** notifications bell actually live, no leaks.

- One realtime channel per logged-in user, multiplexed across notifications + messages + deliverables.
- Unsubscribe on unmount + on auth change.
- Optimistic mark-as-read; reconcile on server response.
- Toast notifications via `sonner` for inbound items while in-app.

**Exit criteria:** no duplicate websocket connections in Network panel; bell badge updates within 1 s of insert.

---

## Step 10 — Observability & testing

**Goal:** catch regressions before users do.

- Vitest unit coverage on `lib/portfolio.ts`, `lib/files.ts`, `lib/audit.ts`, and every new hook from Step 2.
- Playwright smoke suite: `/`, `/portfolio`, `/portfolio/:slug`, `/contact` (submit), `/auth/login`, `/admin` (login), `/app` (login).
- Add an error boundary at each route group root that logs to console + shows a friendly fallback.
- Wire `usePageTracking` to `page_views` with batched inserts (currently per-pageview round-trip).

**Exit criteria:** CI runs typecheck + unit + Playwright on every push; coverage ≥ 60 % on `lib/` and `hooks/`.

---

## Step 11 — SEO, accessibility, i18n parity

- One `<H1>` per page enforced (audit reveals duplicates on About/Services).
- Alt text required prop on `<SmartImage>`.
- Run `axe-core` on each public page; fix contrast + focus-trap issues.
- Verify all three locales (en/my/zo) have every key; add a check script.
- Generate `sitemap.xml` from routes at build time instead of hand-maintaining.

---

## Step 12 — Final polish (the original Phase 2/3 from prior plan)

After the structural work above lands, finish:

- Home featured-projects strip + editorial quote.
- Contact: map iframe, WhatsApp/mailto/tel deep links.
- PortfolioDetail: breadcrumb + related projects.
- Empty states + loading skeletons everywhere.
- Scroll-reveal motion with project easing.

---

## Suggested rollout

1. Steps 1, 3, 4 in one PR — pure wins, no behavior change.
2. Step 2 next — biggest refactor, isolated to hooks.
3. Steps 5, 6 together — UI polish + form hardening.
4. Steps 7, 8 in a backend-focused PR (migrations).
5. Steps 9, 10, 11 in parallel after backend stabilizes.
6. Step 12 last, on top of the cleaner foundation.

Reply with **which step(s) to start with** and I'll execute.