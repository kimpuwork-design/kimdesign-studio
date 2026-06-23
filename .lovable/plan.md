## What I found (from auditing every public page)

**Broken / wrong**
- **Home** — Hero area is mostly empty whitespace. Profile bio contains a raw Google search URL (`https://www.google.com/search?q=shwebootmm.com`) leaked into prose. No featured projects preview. Order of sections feels disjointed.
- **/portfolio** — Top stats show `0 Projects · 0 Featured · 0 Categories` even though there are 10 projects. Counters are broken.
- **/projects vs /portfolio** — Two near-identical public listing pages. Confusing redundancy.
- **About / Services / Contact** — Huge empty band above the headline (hero visual area is empty). Pages look 50% blank above the fold.
- **Headline gradient** ("lasting legacy", "built from scratch", "let's start a conversation", "together") — broken multi-color gradient renders only on first letters; on Blog page "together" reads as "toqether". Looks glitched, not premium.
- **CHURCH project** and similar — broken-image placeholder shows ugly icon when thumbnail missing.
- **Blog** — Page exists in nav but has zero articles ("No articles found"). Dead link in primary nav.
- **Floating chat button** appears on every public page including marketing pages where it adds noise.

**Missing**
- Featured projects preview on Home.
- Working stat strip (years, projects, locations).
- Footer with social links, sitemap, contact info.
- Map + working contact actions (mailto, tel, WhatsApp) on Contact page.
- Related projects + breadcrumb on public project detail.
- Premium scroll-reveal motion (currently mostly static).

---

## Plan (in 3 phases, all on public site only)

### Phase 1 — Remove clutter
1. **Delete `/projects` public page** — redirect to `/portfolio`. One listing only.
2. **Remove Blog from main nav** (keep route accessible so existing URLs don't 404; link comes back when first article is published).
3. **Hide floating chat button** on public marketing pages (keep it inside `/app` and `/admin`).
4. **Remove the broken multi-color headline gradient** across all hero headlines; replace with a single clean premium treatment (white-on-bg with one indigo accent word).
5. **Clean Home bio** — strip the leaked Google URL; render as a proper link only if the user has an actual website.

### Phase 2 — Fix bugs
6. **Portfolio stats counters** — compute `Projects / Featured / Categories` correctly from loaded data.
7. **Image fallback** — when `thumbnail_url` is missing, render a branded gradient tile with the project initials instead of the broken-image icon.
8. **About / Services / Contact empty hero** — collapse the empty band, anchor headline + supporting visual properly so the page opens at a real composition.
9. **Headline gradient cleanup** (see #4) doubles as a fix here.

### Phase 3 — Add premium polish
10. **Home composition** (keep memory rule: profile first):
    - Compact bento intro (profile photo + name + 3 stats + bio) above the fold.
    - Then short "Selected Work" strip showing 3 featured projects with images.
    - Then a single editorial quote.
    - Then "Let's build" CTA.
11. **Featured projects preview** on Home with hover motion.
12. **Public project detail** — add breadcrumb (`Portfolio → category → title`), related projects (3 of same category), consistent typography.
13. **Contact page** — working `mailto:`, `tel:`, WhatsApp deep-links pulled from settings; embed an OpenStreetMap iframe for Yangon HQ.
14. **Footer** — proper footer with logo, nav, social icons (FB/IG/Behance from settings), copyright. Currently no real footer.
15. **Motion** — apply existing easing token (`[0.22, 1, 0.36, 1]`) to scroll-reveal headlines and cards. Subtle, no marquees (per memory).

---

## What I will NOT touch
- Admin dashboard, client portal, edge functions, database — out of scope per your earlier answer.
- Locked design tokens (colors, fonts, bento layout) — staying within Midnight Indigo + Space Grotesk + Inter.
- Multi-language (en/my/zo) — keeping all three.

---

## Open questions before I start

1. **Blog** — hide from nav only, or delete the page entirely? (I'll default to "hide from nav" unless you say delete.)
2. **Floating chat button** — remove from public pages only, or remove project-wide? (Default: public only.)
3. **/projects route** — redirect to /portfolio, or 404? (Default: redirect.)
4. **Bio text on Home** — what should it say? The current paragraph has a leaked search URL and mixes "I" and "we". I'll rewrite it concisely; you can replace the words later.

If this looks right, reply **"go"** and I'll execute all three phases. If you want to drop or change any item, point out the number.