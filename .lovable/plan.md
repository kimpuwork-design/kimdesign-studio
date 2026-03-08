

## Image Viewer Replacement Plan

### Problem
Current `CinematicLightbox` has rendering issues -- images not displaying properly due to complex framer-motion animation variants interfering with image rendering. The component is over-engineered with 500+ lines.

### Approach
Replace with a **simple, reliable image viewer** that shows images at their **true original size** with scroll/pan when oversized. No heavy cinematic effects.

### New Component: `SimpleImageViewer`

**Core behavior:**
- Full-screen dark overlay (`bg-black/95`)
- Image rendered at native pixel dimensions (`width: auto, height: auto`) -- no `max-h`/`max-w` constraints
- When image exceeds viewport, container scrolls (overflow-auto) so user can scroll to see full image
- Left/right arrow navigation (keyboard + click buttons)
- Close on Escape or clicking backdrop
- Touch swipe for mobile navigation
- Optional thumbnail strip at bottom (simple, no animations)
- Counter showing `3 / 12`
- Download button

**What's removed (simplification):**
- Framer Motion slide/zoom animations
- Auto-hide UI timer
- Slideshow/autoplay mode
- Info panel with mini-map
- Zoom/pan system (unnecessary since showing original size with scroll)
- Complex preloading logic

**Structure (~150 lines):**
```text
┌─────────────────────────────────┐
│ [3/12]  [caption]    [↓] [✕]   │  ← top bar (always visible)
│                                 │
│         ┌───────────┐           │
│    ◀    │  original  │    ▶     │  ← scrollable container
│         │   image    │           │
│         └───────────┘           │
│                                 │
│  [thumb][thumb][thumb][thumb]    │  ← bottom strip
└─────────────────────────────────┘
```

### Files Changed

1. **Rewrite** `src/components/media/CinematicLightbox.tsx`
   - Keep same export name + `LightboxImage` interface (no breaking changes)
   - Replace internals with simple, no-animation viewer
   - Native `<img>` with no dimension constraints
   - Scrollable container for oversized images
   - Simple CSS transitions only (opacity for open/close)

2. **No changes needed** to consumers (`GalleryManager.tsx`, `ProjectDetail.tsx`, `PortfolioDetail.tsx`) -- same interface preserved.

### Technical Details
- No framer-motion dependency in this component
- Use `overflow-auto` on the image container for natural scrolling of large images
- Simple `useState` for index, CSS `transition-opacity` for fade
- Touch events: track start/end X for swipe detection
- Keyboard: ArrowLeft/Right, Escape
- Body scroll lock via `overflow: hidden` on mount

