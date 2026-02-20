
# New Features Plan for FORMA Architecture Website

## Overview

I will add 5 high-impact features that elevate the website from a static brochure to a polished, interactive architecture studio showcase:

---

## Feature 1 — Scroll Reveal Animations (CSS-based, no library needed)

Using Intersection Observer API with a custom hook, every section will fade/slide into view as the user scrolls. This gives the page a premium editorial feel.

- Custom `useScrollReveal` hook using `IntersectionObserver`
- Applied to: About Me, Hero, Stats, Services, Testimonials, CTA sections
- Animation style: fade-up (opacity 0→1, translateY 20px→0) with staggered delays

---

## Feature 2 — Dark / Light Mode Toggle in Navigation

Add a sun/moon toggle button to `PublicNav.tsx` using the existing `next-themes` package (already installed).

- Wrap the app in `ThemeProvider` from `next-themes` in `App.tsx`
- Add toggle button to `PublicNav` (right side of nav bar)
- The dark mode CSS variables already exist in `index.css` — just needs activation

---

## Feature 3 — Awards & Recognition Section on Homepage

A new editorial section between Testimonials and CTA showcasing awards and press mentions.

Awards displayed as a horizontal list of press/award logos (text-based, styled beautifully):
- RIBA National Award 2023
- Civic Trust Award 2022
- AJ Small Projects Award 2021
- Dezeen Architecture Award 2020
- Wallpaper* Design Award 2019

Styled as a minimal ticker/strip with a horizontal rule, uppercase labels, and large typographic year numbers.

---

## Feature 4 — Animated Stats Counter

The stats section currently shows static numbers. I will add a count-up animation that triggers when the section scrolls into view:

- `120+` projects, `24` awards, `11` countries, `16` years
- Uses `IntersectionObserver` to start counting when visible
- Smooth easing with `requestAnimationFrame`

---

## Feature 5 — Shared Footer Component

Currently only the Home page has a footer. I will extract it into a shared `PublicFooter.tsx` component and add it to:
- `About.tsx`
- `Services.tsx`
- `Portfolio.tsx`
- `Contact.tsx`
- `PortfolioDetail.tsx`

This gives every page a consistent, branded ending with the studio name, nav links, email, and copyright.

---

## Technical Implementation

### Files to Create
- `src/components/PublicFooter.tsx` — Shared footer extracted from Home.tsx
- `src/hooks/useScrollReveal.ts` — Intersection Observer scroll animation hook

### Files to Modify
- `src/App.tsx` — Wrap in `ThemeProvider`
- `src/components/PublicNav.tsx` — Add dark/light toggle button
- `src/pages/public/Home.tsx` — Apply scroll reveal, animated stats counter, awards section
- `src/pages/public/About.tsx` — Add `PublicFooter`
- `src/pages/public/Services.tsx` — Add `PublicFooter`
- `src/pages/public/Portfolio.tsx` — Add `PublicFooter`
- `src/pages/public/Contact.tsx` — Add `PublicFooter`
- `src/pages/public/PortfolioDetail.tsx` — Add `PublicFooter`

### No new dependencies required
All features use:
- `next-themes` (already installed) for dark mode
- Native browser `IntersectionObserver` for scroll reveal
- Native `requestAnimationFrame` for stat counters
- Tailwind CSS transitions for animations
