# Admin Panel — Next-Level Upgrade

Four feature tracks plus visual polish, sequenced so each ships independently and the panel stays usable throughout.

## 1. Dashboard depth

Extend `src/pages/admin/Dashboard.tsx` with a second analytics row below the existing stat strip:

- **Live visitor map** — world map (react-simple-maps + topojson) with country dots sized by 7-day unique visitors. Source: `page_views` joined to a new `country` column.
- **Top pages (7d)** — bar list of `path` grouped by views and unique visitors.
- **Referrers (7d)** — domain-grouped list from `referrer`.
- **Device / browser split** — donut from a parsed `user_agent`.
- **Revenue vs Leads (30d)** — dual-line area chart combining `invoices.paid_at` and `leads.created_at`.

Backend: add nullable `country`, `path`, `referrer`, `user_agent`, `device` columns to `page_views` (already partially present — confirm and fill gaps in migration), and a lightweight client-side tracker update in `src/lib/analytics.ts` to capture them. No server-side geo lookup yet — country derived from `navigator.language` as a v1 fallback.

## 2. Bulk actions everywhere

A reusable `<BulkActionBar />` + `useBulkSelection()` hook (in `src/components/admin/bulk/`). Wired into:

- Leads — Archive, Delete, Mark contacted, Export CSV
- Clients — Export CSV (no destructive bulk for safety)
- Projects — Archive, Set status, Toggle public, Delete, Export CSV
- Invoices — Mark sent / paid / void, Delete drafts, Export CSV
- Files — Move category, Delete, Bulk download (signed URL zip via edge function later — v1: sequential download)

Pattern: checkbox column on row, sticky action bar slides up from bottom when selection > 0, confirm dialog for destructive ops, optimistic UI + toast.

## 3. Projects workspace

Upgrade `src/pages/admin/Projects.tsx` and the existing Kanban:

- Drag-and-drop **Kanban with inline edit** (title, status, owner) using `@dnd-kit` (already in deps).
- **Saved filter views** stored in `localStorage` per admin (e.g. "My active", "Overdue").
- **Column customization** in table view — show/hide and reorder columns, persisted per admin.
- **Project timeline view** — Gantt-style horizontal bars for `start_date → target_date`, grouped by status, with overdue highlighted.

No schema changes required.

## 4. Inbox & notifications hub

New route `/admin/inbox` (`src/pages/admin/Inbox.tsx`) combining three streams into one virtualized list:

- `messages` across all projects
- `leads` with `status = 'new'`
- `deliverables` with `status = 'submitted'` (awaiting review)

Features: unread badge per stream, search, snooze (client-side `localStorage` until v2 server field), quick-reply for messages, "open in context" link for each item. Realtime updates via existing channels.

Sidebar entry added to `ModernPortalLayout.tsx`.

## 5. Visual polish

- Skeleton loaders for every admin page (extend `SkeletonScreens.tsx`).
- Better empty states (illustration + primary CTA) on Leads, Clients, Files, Invoices, Inbox.
- Page-transition wrapper using framer-motion's `AnimatePresence` in `PortalLayout`.
- Tighter spacing pass on dense tables (10–12 px row height, 11px metadata, sticky headers).
- Consistent action-bar hover states and focus rings.

## Order of delivery

```text
Step A → Visual polish primitives (skeletons, empty-state, page-transition wrapper)
Step B → Dashboard depth (migration + new cards)
Step C → Bulk-action primitives + wire into Leads + Projects + Invoices + Files
Step D → Projects workspace (Kanban DnD inline edit, saved views, columns, timeline)
Step E → Inbox hub
```

Each step is independently shippable and verified with `tsgo --noEmit` + a quick browser smoke test before moving on.

## Technical notes

- New deps: `react-simple-maps` + `world-atlas` for the map. `@dnd-kit` is already installed.
- Migration touches `page_views` only — additive nullable columns, no breaking change.
- All new tables (if any — currently none planned) would include GRANT + RLS.
- No edits to `client.ts`, `types.ts`, or `.env`.
- Existing realtime channels reused; no new publications needed.

Reply **approve** to start with Step A, or tell me which step to do first / skip.
