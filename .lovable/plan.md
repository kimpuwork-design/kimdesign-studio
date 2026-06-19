## Goal

Admin က project တစ်ခုကို edit/create လုပ်တဲ့အခါ ပုံအများကြီး တင်စရာမလိုဘဲ **Google Drive PDF link** (Anyone-with-the-link share) တစ်ခုထည့်လိုက်ရင် —
- PDF ထဲက page တိုင်းကို image အဖြစ်ပြောင်း (server-side render)
- Project ရဲ့ existing `portfolio_gallery` ထဲ images အဖြစ်သိမ်း
- Public Project Detail page မှာ ပုံတွေ gallery/lightbox နဲ့ ကြည့်လို့ရအောင်ပြ

## UX flow

**Admin → ProjectFormModal**
- "Project images" section အောက်မှာ tab/option နှစ်ခု:
  1. Upload images (existing GalleryManager)
  2. **Import from Google Drive PDF** *(new)*
- Drive PDF URL input + "Import pages as images" button
- Progress UI: `Converting page 3 of 12…` → success toast
- Imported pages တွေ ချက်ချင်း gallery list ထဲပေါ်လာမယ်; admin က reorder/delete လုပ်နိုင်
- Re-import လုပ်ရင် ရှေ့က PDF pages တွေကို သပ်သပ်ဖျက်ပြီးအသစ်တင်နိုင်တဲ့ option

**Public side — Project Detail / Portfolio Detail**
- ရှိပြီးသား `portfolio_gallery` rendering ကိုသုံး; ပြောင်းစရာမလို
- Lightbox/grid view အသုံးပြုထားပြီး

## Technical plan

### 1. New edge function: `import-drive-pdf`
`supabase/functions/import-drive-pdf/index.ts`

- Auth: ADMIN/STAFF role only (JWT check မှ profile lookup)
- Input: `{ project_id, drive_url }`
- Steps:
  1. Drive URL ထဲက file ID ထုတ် (regex: `/file/d/{id}`, `?id={id}`)
  2. `https://drive.google.com/uc?export=download&id={id}` ကနေ PDF bytes fetch
     - 403/404 ဖြစ်ရင် "Make sure the link is set to 'Anyone with the link'" error ပြန်
  3. **PDF → images**: `pdfjs-dist` (npm via esm.sh) နဲ့ page count ဖတ်ပြီး page တိုင်းကို canvas render
     - Deno မှာ `@napi-rs/canvas` သို့မဟုတ် `skia-canvas` သုံး; alternative: `pdf-lib` + raster service
     - Fallback approach: `pdfjs-dist` + `canvas` polyfill for Deno
  4. Page တိုင်းကို JPEG (quality 0.85, max-width 2000px) အဖြစ်ပြောင်း
  5. `project-files` bucket ထဲ `pdf-pages/{project_id}/{import_id}/page-001.jpg` သိမ်း
  6. `portfolio_gallery` table ထဲ row တစ်ခုစီ insert (image_url = signed URL or storage path, sort_order = page number, caption = `Page N`)
  7. `file_assets` ထဲမှာလည်း metadata row တင် (category: `deliverables`/`references`)
- Return: `{ imported: N, gallery_ids: [...] }`

### 2. Client-side component: `DrivePdfImporter`
`src/components/admin/DrivePdfImporter.tsx`

- URL input + validation (Drive URL pattern check)
- "Import" button → call edge function via `supabase.functions.invoke('import-drive-pdf', {...})`
- Progress state (function မှာ streaming မလို — single response with count) — loading spinner + "This may take 30-60 seconds for large PDFs"
- Success → toast + `onImported()` callback (parent က gallery refetch)
- Error handling: invalid URL, access denied, too many pages (limit 50), file too large (20MB cap)

### 3. ProjectFormModal integration
- `GalleryManager` အောက်မှာ collapsible `DrivePdfImporter` ထည့်
- Import ပြီးရင် GalleryManager refresh → ပုံတွေပေါ်လာ

### 4. Storage / RLS
- `project-files` bucket ပြီးသား; current policies (staff/admin upload, project access download) သုံးလို့ရ
- `portfolio_gallery` table policies စစ်ပြီး admin insert ရတယ်ဆိုတာ verify

### 5. Config
- `supabase/config.toml` မှာ `[functions.import-drive-pdf]` block + `verify_jwt = false` (in-code JWT check)
- No new secrets needed (public Drive link)

## Limits & guardrails

- Max 50 pages per PDF
- Max 20 MB PDF
- Per-page max width 2000px (smaller for high page counts)
- Timeout warning UI for big files
- Only Drive `/file/d/...` and `?id=...` patterns; other URLs rejected with friendly error

## Files to create / change

- **new** `supabase/functions/import-drive-pdf/index.ts`
- **new** `src/components/admin/DrivePdfImporter.tsx`
- **edit** `src/components/admin/ProjectFormModal.tsx` — add importer below GalleryManager
- **edit** `supabase/config.toml` — register new function (verify_jwt false)

## Out of scope (this iteration)

- Drive folder imports
- Private Drive files (would need OAuth connector)
- On-demand pdf.js rendering (we cache to storage instead, per your choice)
- Re-import/sync if Drive PDF changes (manual re-import only)
