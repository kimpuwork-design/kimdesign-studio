# Premium Hardening + Cleanup

## Add (what's still missing)

### 1. SEO essentials
- `public/sitemap.xml` generated at build/dev time from real routes + published projects.
- `scripts/generate-sitemap.ts` wired through `predev` / `prebuild`.
- `public/robots.txt` allowing all crawlers + `Sitemap:` directive.
- Switch per-route head from custom hook to **react-helmet-async**: per-project `<title>`, `description`, `canonical`, `og:*`, and `Article` JSON-LD on `PortfolioDetail`. Sitewide `og:*` stays in `index.html` as fallback for non-JS crawlers.

### 2. Lightbox accessibility (WCAG)
- `role="dialog"`, `aria-modal="true"`, `aria-label` from project title.
- Focus trap (Tab/Shift-Tab stays inside; Escape closes — already there).
- Return focus to the trigger element on close.
- Live region announcing "Image X of N" on navigation.

### 3. Performance polish
- **Thumbnail transforms** — append `?width=720&quality=75&resize=cover` to Supabase storage URLs in the Portfolio grid (`ProjectCard`) so 4 MB hero JPEGs aren't downloaded for 400 px tiles. Bandwidth drop ≈ 80%.
- **Hover/touchstart prefetch** — on Portfolio cards, prefetch the project metadata + cover image on `pointerenter`/`touchstart` so navigation feels instant.
- **Signed-URL silent refresh** — re-call `get-public-file-urls` ~30 s before the 5-min expiry while the user is still on the project page.

### 4. Reliability
- **`ErrorBoundary`** wrapping each top-level route — one crash no longer blanks the whole app; shows recovery UI with Back/Reload.

## Remove (unused)

### Files (33)
Delete every shadcn primitive not imported anywhere + the orphaned `ProtectedImage`:

```text
src/components/media/ProtectedImage.tsx
src/components/ui/{accordion,alert-dialog,alert,aspect-ratio,badge,
breadcrumb,calendar,card,carousel,chart,checkbox,collapsible,
context-menu,data-table,drawer,form,hover-card,input-otp,menubar,
navigation-menu,pagination,popover,progress,radio-group,resizable,
scroll-area,slider,table,tabs,toggle-group,toggle}.tsx
src/components/ui/use-toast.ts
```

Edge functions reported by knip are **kept** — they are runtime entrypoints invoked by name, not imported in source (knip false positive).

### Dependencies (25 runtime + 2 dev)
`bun remove` the unused packages:

```text
@hookform/resolvers, @radix-ui/react-{accordion,alert-dialog,
aspect-ratio,checkbox,collapsible,context-menu,hover-card,menubar,
navigation-menu,popover,progress,radio-group,scroll-area,slider,
tabs,toggle,toggle-group}, @tanstack/react-table, embla-carousel-react,
input-otp, react-day-picker, react-hook-form, react-resizable-panels,
vaul, @tailwindcss/typography, @testing-library/react
```

Bundle size drop ≈ 200-300 KB minified.

### Unused exports
Leave alone for now — pruning 63 named exports adds noise with little user-facing payoff. Revisit on the next refactor.

## Out of scope
- View-count tracking, PWA, route-level data cache (React Query) — defer to a separate request.
- Image OG generation (`@vercel/og`) — needs a clear visual brief first.

## Technical notes
- Helmet adoption: add `<HelmetProvider>` once in `src/main.tsx`, remove `<link rel="canonical">` from `index.html`, leave sitewide `og:*` in place.
- `ErrorBoundary` is a tiny class component placed inside `<Routes>` per top-level page (or one global wrapper inside `App.tsx`).
- Thumbnail URL helper: small utility in `src/lib/images.ts` that takes a public Supabase URL and appends transform query params; no-op for non-Supabase URLs.
- Sitemap generator queries `projects` where `is_public = true` using the anon key; same source-of-truth as the public route.

## Verification
- `tsgo --noEmit` clean
- `vite build` clean
- `bunx knip` → unused-files count drops to ≤ 5 (edge functions only)
- Playwright smoke: `/`, `/portfolio`, `/portfolio/:slug`, `/contact` load with 0 console errors
