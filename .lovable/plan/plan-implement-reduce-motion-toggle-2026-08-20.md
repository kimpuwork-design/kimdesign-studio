# Plan: Implement "Reduce Motion" Toggle

Add a persistent user preference to disable animations (blur, scale, fade) across the application for improved accessibility.

## User Review Required

> [!IMPORTANT]
> The toggle will be accessible in two places:
> 1. The **Public Header** (via a new accessibility dropdown/icon) for visitors.
> 2. The **Admin Settings** page for the site owner.
>
> When enabled, all `ProgressiveImage` transitions, `framer-motion` page transitions, and portal animations will be simplified or disabled.

## Proposed Changes

### Core Infrastructure
- Create `src/contexts/AccessibilityContext.tsx` to manage `reduceMotion` state (synced to `localStorage` and `prefers-reduced-motion` media query).
- Wrap the application in `AccessibilityProvider` within `src/App.tsx`.
- Add a `.reduce-motion` global class to `index.css` that sets `animation-duration: 0.01ms !important`, `transition-duration: 0.01ms !important`, and `scroll-behavior: auto !important`.

### UI Components
- **Public Navigation**: Add an accessibility icon next to the theme toggle in `src/components/PublicNav.tsx` containing the toggle.
- **Admin Settings**: Add a "Motion & Accessibility" section in the Branding tab of `src/pages/admin/AdminSettings.tsx`.
- **Image Transitions**: Update `src/components/media/ProgressiveImage.tsx` to bypass blur/scale animations when `reduceMotion` is active.
- **Page Transitions**: Update `src/components/PageTransition.tsx` (if it exists) or individual page animations to respect the setting.

### Technical Details
- Use `useAccessibility` hook for local component logic.
- Ensure the setting persists across sessions using `localStorage`.
- Integrate with `framer-motion`'s `MotionConfig` if necessary for global animation control.
