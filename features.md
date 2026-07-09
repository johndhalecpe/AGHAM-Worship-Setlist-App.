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

## Admin new-user notification
Where: `lib/hooks/useNewUserNotification.ts`, `components/layout/Header.tsx`
What it does: Polls every 30s for new pending profiles and shows a Sonner toast to the admin when someone signs up.
Status: working

## Signup success card
Where: `components/auth/CreateAccountForm.tsx`
What it does: After a non-admin user successfully creates an account, the form is replaced by an inline card saying "Thank you for signing up!" and instructions to wait for admin approval, with a "Got it" button to return to the landing page. The user's email is stored in localStorage to track their pending status.
Status: working

## Approval/rejection notification
Where: `components/auth/LoginForm.tsx`, `components/auth/CreateAccountForm.tsx`
What it does: When a previously pending user successfully logs in, a toast says "Your account has been approved! You can now log in." instead of the generic welcome. A rejected user sees a toast.error "Your account has been rejected." on login attempt in addition to the rejection modal. Tracking is done via localStorage (`pendingApprovalEmail`).
Status: working

## Admin approval system
Where: `app/admin/approvals/`, `components/ui/StatusBanner.tsx`, `components/auth/`, `lib/services/profileService.ts`
What it does: New users sign up with `pending` status. The hardcoded admin (`johndhalecpe@setlist.com`) sees an Admin nav link and can approve or reject pending accounts from the `/admin/approvals` page. Rejected users see a full-screen modal on login; pending users see a pending modal. The admin account is auto-detected on signup and granted full access.
Status: working

## Mobile-responsive UI
Where: `components/layout/Header.tsx`, `components/songs/SongCard.tsx`, `components/setlists/setlist-detail/`, `components/ui/`
What it does: Full responsive design with hamburger drawer menu on mobile, WCAG-compliant 44px minimum touch targets on all interactive elements, safe-area-inset padding for notched phones, 100dvh viewport-aware modals that respect the mobile keyboard, viewport-fit=cover meta tag, and `@media (pointer: coarse)` scrollbar sizing. Bottom-sheet modals (ChordsViewer, LyricsViewer) include safe-area padding and use dvh units.
Status: working

## Performance optimizations
Where: `app/api/`, `app/(main)/`, `components/`, `lib/hooks/`, `next.config.ts`
What it does: Cache-Control headers on all GET API routes (max-age=60-300s, stale-while-revalidate). React.cache deduplication for setlist detail page queries (eliminates duplicate Supabase calls in generateMetadata + page component). ISR with revalidate=30s on list pages instead of force-dynamic. React.memo on SongCard and SongSearchList to prevent unnecessary re-renders. useCallback on all handler functions in SongsGroupedView. useDeferredValue on search input for debounced filtering. Selective column queries (SELECT specific columns instead of *) on all list fetches. Animations use GPU-composited properties only (transform, opacity).
Status: working

## Batch API updates
Where: `app/api/setlists/[id]/sections/route.ts`
What it does: Sections PATCH route collects all errors before responding instead of failing on the first one. Prepared for batch upsert pattern to avoid N+1 database round trips when updating multiple sections.
Status: working

## Smart polling
Where: `lib/hooks/useNewUserNotification.ts`
What it does: Admin new-user notification polling pauses when the browser tab is hidden (via Page Visibility API) and resumes when the tab becomes visible again, reducing unnecessary network requests.
Status: working

## Optimized Next.js config
Where: `next.config.ts`
What it does: Configured image formats (AVIF, WebP) and stale times (dynamic: 30s, static: 300s) for optimal caching behavior.
Status: working
