## Lineup management
Where: `app/(main)/setlists/`, `components/setlists/`
What it does: Create, edit, delete, and reorder worship lineups with date, title, song leader, description, and branch.
Status: working

## Song library
Where: `app/(main)/songs/`, `components/songs/`
What it does: Add, edit, and search songs with metadata (key, bpm, time signature, category, language, lyrics, chords).
Status: working

## Section-based lineup builder
Where: `components/setlists/SetlistContent.tsx`, `components/setlists/setlist-detail/SetlistSections.tsx`
What it does: Lineups are split into Worship, Praise, Tithes and offering, and Special number sections. Songs can be added, reordered via drag-and-drop, and removed per section.
Status: working

## Key picker
Where: `components/ui/KeyPicker.tsx`
What it does: Set a musical key for each song in a lineup. Displays as a badge and allows inline editing.
Status: working

## Dark mode
Where: `components/layout/Header.tsx`
What it does: Toggle between light and dark themes. Selection is persisted in localStorage.
Status: working

## Clipboard sharing
Where: `components/setlists/SetlistContent.tsx`
What it does: Copies the full lineup (date, leader, branch, songs per section) as formatted text to the clipboard with a single button.
Status: working

## What's New modal
Where: `components/ui/WhatsNewModal.tsx`, `lib/whatsNew.ts`, `app/page.tsx`
What it does: Slide-in side panel from the right showing categorized changelog. Floating trigger button at top-right of the landing page. Auto-opens on version change. Dismissible via close button, backdrop click, or Escape.
Status: working

## Secondary accent color
Where: `app/globals.css`
What it does: Teal accent color (`--color-accent-secondary`) added alongside the primary orange for visual variety. Uses teal-600 in light mode, teal-400 in dark mode.
Status: working

## PWA (installable web app)
Where: `app/manifest.ts`, `app/layout.tsx`
What it does: Generates a Web App Manifest (`/manifest.webmanifest`) and iOS `apple-mobile-web-app-*` meta tags so the app can be installed as a standalone PWA on mobile and desktop. Icons (`/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`) must be placed in `/public` manually.
Status: working

## Admin approval system
Where: `app/admin/approvals/`, `components/ui/StatusBanner.tsx`, `components/auth/`, `lib/services/profileService.ts`
What it does: New users sign up with `pending` status. The hardcoded admin (`johndhalecpe@setlist.com`) sees an Admin nav link and can approve or reject pending accounts from the `/admin/approvals` page. Rejected users see a full-screen modal on login; pending users see a pending modal. The admin account is auto-detected on signup and granted full access.
Status: working
