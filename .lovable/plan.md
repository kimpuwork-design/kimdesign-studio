
# Photo Gallery for Public Project Detail Page

## Overview
Project detail page ဖွင့်လိုက်တာနဲ့ upload တင်ထားတဲ့ image files (png, jpg, jpeg, webp) အားလုံးကို photo gallery grid ပုံစံနဲ့ ပြမယ်။ ပုံတစ်ပုံကိုနှိပ်ရင် fullscreen lightbox မှာ ကြည့်လို့ရမယ်၊ left/right arrow keys နဲ့ navigate လုပ်လို့ရမယ်။

## What You Will See
- Project ဖွင့်လိုက်ရင် အပေါ်ဆုံးမှာ photo gallery grid (masonry-style) ပေါ်မယ်
- ပုံတစ်ပုံကိုနှိပ်ရင် fullscreen lightbox ပေါ်ပြီး ဘယ်/ညာ ရွှေ့ကြည့်လို့ရမယ်
- Gallery အောက်မှာ non-image files (PDF, DWG, etc.) တွေကို ယခင်အတိုင်း list ပုံစံနဲ့ ပြမယ်

## Technical Details

### 1. Update `src/pages/public/ProjectDetail.tsx`
- Filter image files (`isImageExt`) from all files to create a gallery array
- Generate public URLs for each image using `getPublicUrl`
- Render a responsive grid gallery (2 columns on mobile, 3 on tablet, 4 on desktop) above the file list
- Each image: thumbnail with hover overlay, click to open lightbox
- Non-image files remain in the existing categorized list below

### 2. Add LightBox component (inline in same file)
- Reuse the same pattern from `PortfolioDetail.tsx`
- Fullscreen overlay with dark backdrop
- Left/Right arrow navigation buttons
- Keyboard support (ArrowLeft, ArrowRight, Escape)
- Counter showing "1 / 12" style indicator

### 3. Gallery grid styling
- `aspect-ratio: 1` square thumbnails with `object-cover`
- Hover effect: slight scale + overlay with expand icon
- Consistent with the stone/concrete architectural aesthetic
