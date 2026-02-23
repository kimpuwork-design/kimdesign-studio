

# Fix: Projects Not Showing on Public Pages

## Root Cause Analysis

After inspecting the database:
- **Portfolio page** (`/portfolio`): The `portfolio_items` table has **0 rows** -- there are no portfolio items to display.
- **Public Projects page** (`/projects`): There is 1 project ("Teat") but it has `is_public = false`, so it's correctly hidden.

The code logic is working perfectly. The fix involves **seeding the database with data** and marking existing projects as public.

---

## Plan

### 1. Mark existing project as public
Update the existing project's `is_public` flag to `true` so it appears on the `/projects` page.

### 2. Add sample portfolio items
Insert sample portfolio entries into `portfolio_items` so the `/portfolio` page has content to display. These will include:
- 3-4 sample architecture portfolio items with titles, summaries, categories, and tags
- At least 1 marked as `is_featured = true`
- All marked as `is_published = true`

### 3. Fix the console warning (bonus)
The console shows a `forwardRef` warning from `PublicNav` and `PublicFooter` being given refs. This will be fixed by wrapping them with `React.forwardRef` or removing the ref usage.

---

## Technical Details

### Database changes (via migration):
```sql
-- Make existing project public
UPDATE projects SET is_public = true WHERE id = '8d15a8bb-20f4-4225-a003-fdd55d1bddb7';

-- Insert sample portfolio items
INSERT INTO portfolio_items (slug, title, summary, category, location, year, tags, is_featured, is_published, cover_image_url)
VALUES
  ('modern-lakeside-residence', 'Modern Lakeside Residence', 'A contemporary home designed to harmonize with its natural lakeside setting.', 'Residential', 'Inle Lake, Myanmar', 2024, ARRAY['modern','lakeside','sustainable'], true, true, ''),
  ('cultural-arts-center', 'Cultural Arts Center', 'A civic building celebrating local arts and community gathering.', 'Cultural', 'Mandalay, Myanmar', 2023, ARRAY['cultural','civic','community'], false, true, ''),
  ('urban-mixed-use-tower', 'Urban Mixed-Use Tower', 'Mixed-use development combining retail, office, and residential spaces.', 'Mixed-Use', 'Yangon, Myanmar', 2025, ARRAY['urban','mixed-use','tower'], true, true, ''),
  ('boutique-hotel-interior', 'Boutique Hotel Interior', 'Interior design for a boutique hotel blending tradition with modern comfort.', 'Interior', 'Bagan, Myanmar', 2022, ARRAY['interior','hospitality','boutique'], false, true, '');
```

### Files to modify:
- `src/components/PublicNav.tsx` -- fix forwardRef warning
- `src/components/PublicFooter.tsx` -- fix forwardRef warning

### No new dependencies needed.

