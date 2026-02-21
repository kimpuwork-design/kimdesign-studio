

# Next Level Enhancement Plan

Your app already has a solid foundation -- public website, admin/staff/client portals, project management, billing, and portfolio CMS. Here's what will take it to the next level:

---

## 1. Dark/Light Theme Toggle
Currently the public site and portal use fixed themes. Add a theme switcher (sun/moon icon) in the top bar and public nav so users can toggle between dark and light mode. You already have `next-themes` installed but it's not actively used.

## 2. Real-time Notifications & Messages
Messages and notifications currently require page refresh. Enable real-time updates using the database's realtime capabilities so new messages appear instantly and notification counts update live -- no refresh needed.

## 3. Admin Dashboard -- Upcoming Deadlines Widget
Add a "Upcoming Deadlines" section to the admin dashboard showing projects with target dates in the next 14 days, sorted by urgency. This gives you at-a-glance project health.

## 4. Global Search (Command Palette)
Add a Cmd+K / Ctrl+K command palette (you already have `cmdk` installed) that lets you quickly search across projects, clients, leads, and pages from anywhere in the admin portal.

## 5. Mobile-Responsive Sidebar
The portal sidebar currently doesn't adapt well on mobile. Add a hamburger menu that opens the sidebar as an overlay/drawer on small screens, then auto-closes on navigation.

## 6. Public Site -- Smooth Page Transitions
Add fade/slide transitions between public pages using CSS animations for a more polished, professional feel when navigating between Home, Portfolio, Services, etc.

## 7. Avatar Upload for Admin Profile
In Admin Settings, add an avatar upload feature so the admin's profile photo appears in the sidebar and topbar instead of just text initials.

## 8. Contact Form -- Email Notification
When a lead submits via the Contact page, trigger a backend function to send an email notification to the admin's configured contact email, so no lead goes unnoticed.

---

## Technical Details

### Theme Toggle
- Use `next-themes` ThemeProvider (already installed) with `attribute="class"`
- Add toggle button to `PortalLayout` topbar and `PublicNav`
- Tailwind's `darkMode: "class"` handles the rest

### Realtime
- Enable realtime on `messages` and `notifications` tables via SQL migration
- Subscribe to postgres_changes in `MessageThread` and `NotificationBell` components
- Auto-append new messages; increment unread badge count

### Command Palette
- Use `cmdk` (already installed) to build a search dialog
- Fetch recent projects, clients, leads on open
- Filter client-side; navigate on select

### Mobile Sidebar
- Use `Sheet` component (already have `vaul`) as a slide-out drawer
- Show hamburger icon in topbar when viewport < 768px
- Close drawer on link click

### Upcoming Deadlines
- Query `projects` table where `target_date` is within next 14 days
- Display as a compact list with color-coded urgency (red/yellow/green)

### Avatar Upload
- Upload to `portfolio` storage bucket under `avatars/` prefix
- Save URL to `profiles.avatar_url` column (already exists)
- Display in sidebar footer and topbar

### Email Notification (Backend Function)
- Create a backend function triggered by the frontend after lead insertion
- Uses Resend or built-in SMTP to send notification email

### Page Transitions
- Add CSS keyframe animations for route transitions
- Wrap route outlet in animation container

---

## Priority Order

| Priority | Feature | Impact |
|----------|---------|--------|
| 1 | Mobile-Responsive Sidebar | Usability -- currently broken on mobile |
| 2 | Dark/Light Theme Toggle | Polish -- `next-themes` already installed |
| 3 | Global Search (Cmd+K) | Productivity -- `cmdk` already installed |
| 4 | Real-time Notifications | UX -- instant updates |
| 5 | Upcoming Deadlines Widget | Admin productivity |
| 6 | Avatar Upload | Personalization |
| 7 | Page Transitions | Visual polish |
| 8 | Email Notification | Business -- never miss a lead |

