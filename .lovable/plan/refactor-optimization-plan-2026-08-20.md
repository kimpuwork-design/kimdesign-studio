# Refactor & Optimization Plan

A staged plan to clean up the codebase, cut bundle size, speed up data loading, and harden the architecture without changing user-facing features. Each phase is independently shippable and reversible.

---

## Phase 1 — Foundations (Low risk, high leverage)

Goal: remove footguns, standardize patterns, set up measurement.

1. **Type hygiene**
   - Replace `any` in shared modules (`useSiteContent`, `CommandPalette`, App routes) with generated Supabase row types from `src/integrations/supabase/types.ts`.
   - Convert empty `interface X extends Y {}` to `type` aliases (`textarea.tsx`, `command.tsx`).
   - Turn on `"noUncheckedIndexedAccess": true` in `tsconfig` and fix the fallout.

2. **Standardize data fetching**
   - Adopt `@tanstack/react-query` (already in deps) as the only data layer for reads.
   - Delete bespoke `useEffect + setState + setLoading` patterns in pages and replace with `useQuery` hooks under `src/queries/` (one file per entity).
   - Wrap mutations in `useMutation` with `onError → reportError` (from `src/lib/errors.ts`) and `onSuccess → queryClient.invalidateQueries`.

3. **Single Supabase access pattern**
   - Move all raw `supabase.from(...)` calls into `src/data/<entity>.ts` repositories returning typed results.
   - Components/pages call repositories, never the client directly. Easier to mock, audit, and refactor.

4. **Measurement baseline**
   - Add `vite-bundle-visualizer` and record current bundle map.
   - Capture Lighthouse + Web Vitals (LCP, INP, CLS) on Home, Portfolio, Admin Dashboard.

---

## Phase 2 — Component & Code Splitting

Goal: shrink initial JS, isolate heavy surfaces.

1. **Route-level code splitting**
   - Convert every page in `src/pages/admin`, `src/pages/staff`, `src/pages/client` to `React.lazy`.
   - Public routes stay eager only for Home; Portfolio/About/Services/Contact become lazy.
   - Wrap router with a global `<Suspense fallback={<PageTransition />}/>`.

2. **Heavy-component lazying**
   - Lazy-load: `CinematicLightbox`, `ImageOverlayEditor`, PDF generators, Three.js / 3D engine, charts in `DashboardInsights`, rich text/markdown editors.
   - Defer until the trigger event (open modal, scroll into view).

3. **Decompose oversized files**
   - Target any file > 400 lines (`MessageThread.tsx`, `ProjectFormModal.tsx`, `BillingTab.tsx`, public `Home`, `About`, `Services`).
   - Extract: data hooks → `*.queries.ts`, subcomponents → `./parts/`, types → `./types.ts`.

4. **Design-system pass**
   - Audit components for hardcoded colors (`text-white`, `bg-black`, `bg-[#...]`) and replace with tokens from `index.css`.
   - Consolidate duplicate buttons/cards/section wrappers into shadcn variants.

---

## Phase 3 — Database & Backend

Goal: faster queries, fewer round-trips, safer access.

1. **Index pass driven by `pg_stat_statements`**
   - Run the slow-queries tool, inspect each top offender with `EXPLAIN (ANALYZE, BUFFERS)`.
   - Add indexes via migrations for hot filter columns: `projects(client_id, status)`, `messages(thread_id, created_at desc)`, `notifications(user_id, read_at)`, `file_assets(project_id, category)`, `invoices(project_id, status)`, `page_views(created_at)`.

2. **Eliminate N+1 reads**
   - Audit list pages for sequential queries; collapse into a single `select(... , relation(*))` join.
   - For Dashboard insights, replace per-card client queries with one RPC returning all KPIs as JSON.

3. **Edge functions for aggregations**
   - Move analytics rollups (top pages, referrers, devices) into a SQL view or scheduled materialized view refreshed every 5 min. Frontend reads the view.
   - Move PDF generation, Drive imports, and email fan-out to edge functions; reuse `friendlyErrorMessage` on the client.

4. **RLS & GRANT audit**
   - Re-run the security scan, confirm every public-schema table has explicit `GRANT` matching its policy (anon, authenticated, service_role).
   - Add policy unit tests via a SQL fixture in `supabase/tests/`.

5. **Realtime cleanup**
   - Centralize channel creation in `src/realtime/` hooks. Ensure every `supabase.channel(...)` has matching `removeChannel` in cleanup.
   - Replace polling with realtime where applicable (notifications, deliverables, messages).

---

## Phase 4 — Assets & Media Performance

Goal: faster LCP, smaller payloads, smoother gallery.

1. **Image pipeline**
   - Add `vite-imagetools`. Convert imported hero/portfolio images to `?format=avif` + `?format=webp` with `<picture>` fallback.
   - Preload only the Home LCP image: `<link rel="preload" as="image" fetchpriority="high">`.

2. **Storage assets (Supabase)**
   - Generate `webp`/`avif` derivatives on upload via an edge function; store alongside originals.
   - Serve thumbnails for grids, full-res only in lightbox.
   - Replace `signed URL on each render` with cached signed URLs (5 min TTL) in a small `useSignedUrl` hook backed by a Map.

3. **Lazy & responsive**
   - All `<img>` use `loading="lazy"` (except LCP) and `decoding="async"` with `width`/`height` to prevent CLS.
   - Add `srcset` + `sizes` to portfolio grid images.

4. **Fonts**
   - Self-host Space Grotesk + Inter via `@fontsource-variable/*`, preload only the two subsets actually used, `font-display: swap`.

---

## Phase 5 — Frontend Architecture

Goal: cleaner boundaries, easier to reason about.

1. **Folder reorg**
   ```text
   src/
     app/        router, providers, layout shells
     features/   <domain>/components, hooks, queries, types
       projects/
       invoices/
       messaging/
       portfolio/
     data/       repositories (supabase calls)
     lib/        validation, errors, csv, formatting (no UI)
     ui/         shadcn primitives + design-system wrappers
     pages/      thin route components that compose features/
   ```
2. **Cross-cutting concerns**
   - Single `ErrorBoundary` wrapping each route shell with a per-route fallback.
   - Global toast + loading bar driven by react-query `isFetching` count.
   - Centralized analytics tracker (`src/lib/track.ts`) instead of scattered `page_views` inserts.

3. **i18n consolidation**
   - Move static dictionaries out of `LanguageContext` into per-feature JSON, loaded with dynamic import per language.
   - Add a `t("key", { default })` helper that warns in dev when a key is missing.

---

## Phase 6 — Tooling, Quality, CI

Goal: prevent regressions of everything above.

1. **Lint & format**
   - Tighten `eslint`: enable `react-hooks/exhaustive-deps` as error in feature folders after Phase 1 cleanup.
   - Run `prettier` once across the repo; commit a formatting baseline.

2. **Tests**
   - Vitest unit tests for `lib/validation`, `lib/errors`, repositories with a Supabase mock.
   - Playwright smoke tests: login, create project, upload file, send message, generate invoice PDF.

3. **CI gates**
   - Type check, lint, unit tests, bundle-size budget (`size-limit`) for `dist/assets/index-*.js`.
   - Lighthouse CI budget on Home + Admin Dashboard.

4. **Docs**
   - `README` section: architecture overview + folder map.
   - `CONTRIBUTING.md`: data fetching rules, design tokens, secret policy.

---

## Sequencing & Effort

```text
Phase 1  Foundations           ~1 week   low risk, unblocks everything
Phase 2  Splitting & components ~1 week   user-visible perf win
Phase 3  Database & backend    ~1 week   needs slow-query data first
Phase 4  Assets & media        ~3 days   biggest LCP improvement
Phase 5  Architecture reorg    ~1 week   do after Phase 1-2 stabilize
Phase 6  Tooling & CI          ongoing
```

Ship one phase at a time. Each phase ends with: typecheck green, smoke tests pass, measurement re-captured and compared to baseline.

---

## Technical Details

- **React Query keys**: `['projects', { status, clientId }]`, `['project', id]`, `['invoices', projectId]`. `staleTime: 30s` for lists, `5m` for static settings.
- **Bundle budgets**: initial JS ≤ 200 KB gzip; admin route chunk ≤ 150 KB gzip; image LCP ≤ 120 KB.
- **Indexes (initial set)**: `CREATE INDEX projects_client_status_idx ON projects(client_id, status);` plus the others listed in Phase 3.1. All via migrations (no `CONCURRENTLY` inside migration tx).
- **Realtime hook contract**: `useRealtime(table, filter, onChange)` returns nothing, owns channel lifecycle, uses `useEffect` cleanup.
- **Signed-URL cache**: `Map<path, { url, expiresAt }>`, refresh when `expiresAt - now < 30s`.
- **Image variants**: store `path`, `path_webp`, `path_thumb` columns on `file_assets`; populate via `on-upload` edge function using `sharp`.
- **No new backend providers** — keep Lovable Cloud (Supabase) and Lovable AI Gateway as the only integrations.
