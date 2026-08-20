# SEO Metadata Plan

Optimize search engine visibility and social sharing for all public routes by implementing descriptive, localized metadata.

## Tasks
1. **Consolidate useSEO usage**: Ensure every public page calls `useSEO` with specific values.
2. **Localize Metadata**: Use `useTranslation` to provide localized titles and descriptions for Home, Portfolio, About, Services, and Contact.
3. **Enhance useSEO Hook**: Support Burmese/localized defaults if not provided.
4. **Social Sharing**: Ensure OG tags are correctly populated.

## Technical Details
- **Files**: `src/pages/public/Home.tsx`, `Portfolio.tsx`, `About.tsx`, `Services.tsx`, `Contact.tsx`, `src/hooks/useSEO.ts`.
- **Logic**: Use `t("seo_home_title")` etc. in pages.
- **Fallbacks**: Use studio name and localized tagline as defaults.
