

# Comprehensive "All Portals" Upgrade Plan

## Summary

Upgrade the **Staff Portal** to match the premium level of Admin/Client portals, and polish remaining Admin pages (Settings, Deliverables, Analytics) with consistent glassmorphism, animations, and better data presentation.

## Scope

### 1. Staff Dashboard Premium Upgrade
**File**: `src/pages/staff/Dashboard.tsx`
- Add dynamic time-based greeting (Good morning/afternoon/evening)
- Add recent deliverables feed with status indicators
- Add upcoming deadlines section from assigned projects
- Enhance stat cards with animated counters and gradient hover effects
- Add project status distribution mini-chart (simple bar/dots)

### 2. Staff Projects Listing Upgrade
**File**: `src/pages/staff/Projects.tsx`
- Add search input alongside status filters
- Add staggered entrance animations with framer-motion
- Add skeleton loading states (matching client portal pattern)
- Enhance cards with thumbnail support and progress indicators
- Add empty state illustration improvements

### 3. Staff Project Detail Premium
**File**: `src/pages/staff/ProjectDetail.tsx`
- Add visual progress tracker (matching client portal's Inquiry -> Active -> Review -> Delivered)
- Upgrade tabs to pill-style segmented control with `layoutId` animated underline
- Add project hero section with gradient background
- Enhance overview cards with glass-card styling and icons
- Add team member avatars in a horizontal stack

### 4. Admin Settings Page Polish
**File**: `src/pages/admin/AdminSettings.tsx`
- Add tab-based navigation (Account / Branding / Contact / Social) instead of long scroll
- Add section icons and subtle card animations
- Improve form layout with better visual hierarchy

### 5. Admin Deliverables Page
**File**: `src/pages/admin/Deliverables.tsx`
- Add search and status filter pills
- Add staggered list animations
- Enhance table with hover actions and status color coding

### 6. Admin Analytics Page
**File**: `src/pages/admin/Analytics.tsx`
- Add page view trend chart using Recharts (data from page_views table)
- Add top pages table with visit counts
- Add referrer breakdown visualization
- Date range filter (7d, 30d, 90d)

## Technical Approach

- Use `framer-motion` for staggered reveals, `AnimatePresence` for tab transitions
- Use `recharts` (already installed) for Analytics charts
- Follow existing patterns: `glass-card`, `glass-card-hover`, portal CSS variables
- Use `useSettings()` hook where studio name is needed
- Skeleton components using existing Skeleton UI component

## Files to Modify (6 files)
1. `src/pages/staff/Dashboard.tsx` - Premium dashboard with greeting, deliverables feed, deadlines
2. `src/pages/staff/Projects.tsx` - Search, animations, skeletons
3. `src/pages/staff/ProjectDetail.tsx` - Progress tracker, pill tabs, hero section
4. `src/pages/admin/AdminSettings.tsx` - Tab-based layout
5. `src/pages/admin/Deliverables.tsx` - Filters, animations, polish
6. `src/pages/admin/Analytics.tsx` - Charts and data visualization

