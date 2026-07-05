# Worship Setlist — Complete Feature Inventory

> AGHAM church worship team setlist manager. Built with Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Supabase.

---

## 📂 Song Library

### Song Management
- **View all songs** — Songs displayed in a grouped layout by category (Worship, Praise, Tithes and offering, Special numbers, Other) then by language (English, Filipino), fetched from Supabase ordered by title ascending.
- **Search songs** — Search bar that queries by title, author, or lyrics with results split into three match groups (title matches, author matches, lyrics matches).
- **Filter panel** — Toggle-able filter panel with category filter (Worship, Praise, Other, Draft — mutually exclusive), language filter (English, Filipino — multi-select), author filter ("Composed" button filters to author "kenneth acebuche"), time signature filter (4/4, 3/4, 6/8 — multi-select), clear filters button, and a badge counting active filters.
- **Lock/unlock library** — Toggle to prevent editing and deleting songs when locked; visual padlock icon indicates state.
- **Add a new song** — Dedicated page (`/songs/new`) with a full creation form.
- **Edit a song** — Modal dialog with pre-filled fields for title, author, category, language, lyrics, chords, key, BPM, and time signature; save triggers `PATCH /api/songs/[id]`.
- **Delete a song** — Trash icon button with a confirmation dialog before sending `DELETE /api/songs/[id]`.
- **Inline chords editing** — On song cards, expand the chords section; when unlocked, chords are editable inline via a textarea with Save/Cancel, persisting via `PATCH /api/songs/[id]`.
- **Expand/collapse lyrics** — Toggle to show or hide lyrics in a `<pre>` block on each song card.
- **Expand/collapse chords** — Toggle to show or hide chord text on each song card.
- **Draft visual indicator** — Songs with `status === "draft"` get a subtle red-tinted background.
- **Draft missing-tags badges** — When the Draft filter is active, draft songs show badges for each missing field (Lyrics, Key, BPM, Time).
- **Draft-only view** — Selecting the "Draft" category filter isolates all draft songs.
- **Duplicate detection on creation** — On new song submit, calls `GET /api/songs?search=<title>`; if a duplicate title is found, a "Save anyway?" warning is shown instead of submitting immediately.
- **Author autocomplete** — On new and edit song forms, the author field provides autocomplete suggestions from all existing song authors, with keyboard navigation (ArrowUp/Down, Enter, Escape, click outside closes).

### Song Data Fields
- **Title** — Required text field.
- **Author** — Optional text field with autocomplete.
- **Category** — Toggle selection among Worship, Praise, Other; when "Other" is selected, a custom category text input appears.
- **Language** — Toggle between English and Filipino.
- **Lyrics** — Freeform textarea.
- **Chords** — Freeform textarea for chord notation.
- **Key** — Musical key selector with letter buttons (C, D, E, F, G, A, B), flat/sharp toggles, and minor toggle.
- **BPM** — Numeric input with decrement/increment buttons, validation (40–300 range, clamped on blur).
- **Time Signature** — Toggle buttons for 4/4, 3/4, 6/8.
- **Status** — Auto-set to "published" when all details (key, BPM, time signature, lyrics) are filled; otherwise set to "draft".

### API Endpoints — Songs
- `GET /api/songs` — List all songs with optional `?search=` query parameter for case-insensitive search by title, author, or lyrics using ILIKE.
- `POST /api/songs` — Create a new song; auto-assigns status based on completeness; returns 201.
- `GET /api/songs/[id]` — Fetch a single song by ID; returns 404 if not found.
- `PATCH /api/songs/[id]` — Update allowed fields (title, author, category, language, default_key, default_bpm, default_time_signature, lyrics, chords, status); auto-publishes if all details are present.
- `DELETE /api/songs/[id]` — Delete a song by ID.

---

## 📂 Setlists / Lineups

### Setlist Management
- **View all lineups** — List page (`/setlists`) that fetches all setlists with their sections and songs, split into **Upcoming** (date >= today, ascending) and **Past** (date < today, descending).
- **Create a lineup** — Dedicated page (`/setlists/new`) with a form including title (optional), date (required, via DatePicker with `minDate` set to today), song leader (optional), branch (grid of 4 branch buttons), and description (optional textarea).
- **View single lineup** — Detail page (`/setlists/[id]`) with all metadata, sections, and songs; generates dynamic OG metadata for social sharing.
- **Edit lineup metadata** — Inline editing form for date, title, song leader, description, and branch.
- **Delete a lineup** — Confirmation dialog with red "Delete" button; blocked for past-lineup dates.
- **Lock/unlock lineup** — Toggle lock persists to localStorage (`setlist-lock-<id>`); auto-locked for past dates; when locked, all edit/delete/add/reorder controls are hidden or disabled.
- **Locked banner** — Informational message displayed when a lineup is locked.
- **Copy lineup as formatted text** — Generates a block of text with the date, song leader, branch, title, description, all sections with song keys/titles/authors, and a link; copies to clipboard via `navigator.clipboard.writeText()`; shows "Copied!" status for 10 seconds.
- **Save and exit** — Bottom button that PATCHes both the setlist metadata and all section order/notes/key changes in a single action, then navigates to `/setlists`.

### Section Management
- **Four section types** — Each lineup has: Worship songs, Praise songs, Tithes and offering, Special numbers.
- **Add song to section** — When unlocked, each section has an "+ Add song" button that opens the SongPicker inline.
- **Remove song from section** — Trash icon per song with confirmation; blocked for past lineups.
- **Reorder songs within a section** — Two methods available:
  - **Drag and drop** — HTML5 native drag/drop with visual feedback (opacity on dragged item, dashed border on drop target).
  - **Move up/down buttons** — Triangle arrow buttons that swap sort_order with the adjacent song.
- **Per-song notes** — Click the note (pen) icon to open an inline textarea for adding or editing a note per song; Save/Cancel buttons.
- **Per-song key override** — Click the key badge to open the KeyPicker and change the song's key for that specific service; override key is shown in accent color when different from default.
- **Read-only BPM badge** — Displays the song's BPM (defaults to 120 if not set).
- **Read-only time signature badge** — Displays the song's time signature.
- **Edit song from within lineup** — Click the edit button on a song card in a section to open the SongEditForm modal; changes are saved directly to the songs table.
- **Empty state per section** — Each section shows a message when no songs have been added yet.

### Lyrics Viewer
- **Full-screen lyrics modal** — Opens for a section type, showing all songs with their lyrics in a `<pre>` block.
- **Auto-scroll to active song** — The active/highlighted song is scrolled into view on open.
- **Per-song lyrics copy** — Each song has a copy button that copies its lyrics to clipboard, shows "Copied!" state for 2 seconds.
- **Close via backdrop, Escape, or close button** — Backdrop has blur effect.
- **Empty state** — Message displayed when no songs exist in the section type.

### Chords Viewer
- **Full-screen chords modal** — Opens for a section type, showing chord charts in monospace `<pre>` blocks.
- **Chords view** — Shows all songs with chord charts; editable intro (before first song), outro (after each song), and transition (between songs) text inputs.
- **Drums view** — Toggle view that shows editable textarea for drummer notes per song, with auto-resizing.
- **Zoom controls** — 12 zoom levels from 12px to 36px for chord text size.
- **Auto-save on close** — Compares notes vs initial state on close; if changed, sends `PATCH /api/setlists/[id]/sections` with chord_notes data.
- **Active song highlighting** — The active song is visually highlighted.
- **Read-only when past** — All editing is disabled when the lineup date is in the past.
- **Close via backdrop, Escape, or close button** — Blocks body scroll while open.

### Song Picker (Add to Setlist)
- **Inline song picker** — Opens within the section area; fetches all songs via `GET /api/songs`.
- **Category filtering** — Filters displayed songs based on the section type (worship section shows Worship-category songs, praise section shows Praise-category songs, others show all).
- **Search within picker** — Search input searches by title, author, or lyrics.
- **Grouped search results** — Results displayed in match groups (title, author, lyrics) via SongSearchList.
- **"Add as new song" fallback** — If no song is found, a button allows creating a new song inline via the inline NewSongForm.
- **Inline new song creation** — Form within the picker to create a song (with title pre-filled from search query) and immediately add it to the current section in one flow.
- **Select to add** — Clicking a song sends `POST /api/setlists/[id]/sections` with song_id and section_type, then calls back with the new section.

### API Endpoints — Setlists
- `GET /api/setlists` — List all setlists ordered by date descending.
- `POST /api/setlists` — Create a new setlist; validates date is not in the past; returns 201.
- `GET /api/setlists/[id]` — Fetch a single setlist by ID.
- `PATCH /api/setlists/[id]` — Update setlist fields; returns 403 if the setlist date is in the past.
- `DELETE /api/setlists/[id]` — Delete a setlist by ID; returns 403 if the setlist date is in the past.
- `GET /api/setlists/[id]/sections` — List all sections for a setlist, joined with song data, ordered by sort_order.
- `POST /api/setlists/[id]/sections` — Add a song to a setlist section; returns 403 if past date; auto-determines sort_order.
- `PATCH /api/setlists/[id]/sections` — Batch update sections (sort_order, notes, song_key, override_lyrics, chord_notes); returns 403 if past date.
- `DELETE /api/setlists/[id]/sections` — Remove a song from a setlist section via `?sectionId=`; returns 403 if past date.

---

## 📂 UI / UX

### Navigation & Layout
- **Sticky app header** — Fixed-top header with backdrop blur, logo link to homepage, navigation links ("Lineups", "Songs") with active state highlighting using the accent color.
- **Main layout container** — Centered `max-w-5xl` content area with consistent padding below the header.
- **Footer** — Displays "Agham Setlist 0.1.2 / Property of AGHAM (c) 2026 / dev - dhalecpe" at the bottom of all main pages.
- **Back navigation** — Back button on create/edit pages uses `router.back()`.
- **Landing page** — Welcome screen with logo, "Welcome, Agham worship team!" heading, descriptive subtitle, decorative background skeleton, and a "View lineups" CTA button linking to `/setlists`.

### Theme & Appearance
- **Dark mode** — Default theme; toggled via a sun/moon icon button in the header; preference persisted to `localStorage.theme`.
- **Light mode** — Alternative theme with lighter color variables.
- **Flash-of-wrong-theme prevention** — Inline `<script>` in `<head>` reads `localStorage.theme` and applies the `.dark` class before first paint.
- **Brand accent color** — Custom `gold-500` (#D84F0B) used throughout for highlights, active states, focus indicators, and key elements.
- **Church secondary color** — Custom `church-*` blue color family.
- **Custom CSS variables** — Variables for surfaces, cards, elevated surfaces, muted surfaces, borders, text (primary, secondary, tertiary), accent, danger, success, and badge colors.
- **Custom scrollbar** — Thin styled scrollbar matching the theme (dark and light variants).
- **Setlist preview cards** — Hover animation (translate -y); past setlists rendered dimmed with reduced opacity and grayscale filter.

### Responsive & Touch
- **Mobile-friendly** — Tailwind responsive breakpoints used throughout.
- **Touch optimization** — `touch-action: manipulation` on interactive elements; minimum touch target sizes (44px height, 36px buttons).
- **Suppress body scroll in modals** — Body scroll is blocked when any modal is open (`overflow: hidden`).

### UI Components
- **KeyPicker** — Musical key selector with 7 letter buttons (C–B), flat/sharp toggles (disabled when musically invalid), minor toggle, current key preview, Save and Cancel buttons; validates against a set of known musical keys.
- **DatePicker** — Custom calendar dropdown with month/year navigation (prev button disabled at minMonth), day grid (Sun–Sat), Sunday dates in accent color, selected date highlighted, today's date subtly highlighted, dates before `minDate` disabled, click-outside-to-close.
- **ConfirmDialog** — Reusable confirmation modal with dark overlay, centered card, title, message, Cancel and Confirm buttons, loading state ("Deleting..."), customizable confirm label.

### Input & Interaction
- **Search bar** — Text input with search icon, X clear button, accent color border on focus.
- **Author autocomplete dropdown** — Keyboard-navigable dropdown (ArrowUp/Down, Enter, Escape, click outside closes).
- **Keyboard shortcuts** — Ctrl+Enter / Cmd+Enter to submit forms; Escape to close modals.
- **Loading states** — Buttons show disabled state and "Saving..."/"Deleting..." text while operations are in progress.
- **Error display** — Error messages shown when API operations fail.

### Toast Notifications
- **Sonner Toaster** — Themed toast notifications for all success/error messages throughout the application.

---

## 📂 Data & Persistence

### Database (Supabase)
- **songs table** — Stores all song data: id (uuid), title, author, category, language, default_key, default_bpm, default_time_signature, lyrics, chords, status (draft/published), created_at.
- **setlists table** — Stores all lineup data: id (uuid), date (YYYY-MM-DD), title, description, song_leader, branch, created_at.
- **setlist_sections table** — Junction table linking songs to setlists: id (uuid), setlist_id (FK), song_id (FK), section_type, sort_order, notes, song_key, override_lyrics, chord_notes (JSONB), created_at.
- **Supabase client** — Initialized once from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.
- **SQL migration** — Migration script (`supabase-migration.sql`) documents schema changes over time.

### Client-Side Persistence
- **Lock state** — Setlist lock/unlock persisted to `localStorage.setlist-lock-<id>`.
- **Theme preference** — Dark/light mode persisted to `localStorage.theme`.

### Data Validation
- **Past-date guard** — API-level guard function `isSetlistDateInPast(id)` prevents modifying (PATCH/DELETE) or removing songs from past-dated setlists, returning HTTP 403.
- **Date validation on creation** — New setlists cannot be created with a date in the past.
- **Auto-publish on completeness** — Songs are auto-set to "published" status when all musical details (key, BPM, time signature, lyrics) are provided; otherwise set to "draft".
- **Duplicate song detection** — Client-side check on song creation to warn about existing songs with the same title.
- **BPM range validation** — BPM input validated to 40–300 range, clamped on blur.
- **Musical key validation** — KeyPicker validates against a set of known valid musical keys.

---

## 📂 Branch Management

### Church Branches
- **Four branches** — Carissa 1 Main (`carissa_1`), Carissa 2 (`carissa_2`), Antipolo (`antipolo`), Cainta (`cainta`).
- **Branch labels** — Centralized mapping via `BRANCH_LABELS` record and `getBranchLabel()` utility function.
- **Branch selection UI** — Setlist create/edit forms use a grid of 4 branch buttons for selection.
- **Branch display** — Branch label is displayed on setlist preview cards (accent color, top-right) and on the setlist detail header.

---

## 📂 Setlist Preview & Listing

### Setlist List Page
- **Upcoming/Past split** — Setlists are split into two sections: Upcoming (date >= today, sorted ascending) and Past (date < today, sorted descending).
- **"Schedule a lineup" button** — Prominent button linking to `/setlists/new`.
- **SetlistPreviewCard** — Card showing formatted date (e.g., "March 15, 2026"), branch label, title, description (italic), worship and praise section song previews, "+ more sections" indicator, song leader with microphone icon.
- **Dimmed past cards** — Past setlist cards have reduced opacity and grayscale filter.
- **Click to view** — Cards link to `/setlists/[id]`.
- **Empty state messages** — Appropriate messages when no upcoming or past setlists exist.

### SectionSongList
- **Section-type filtering** — Filters sections by type (worship, praise, tithes_offering, special), sorts by sort_order.
- **Section heading** — Displays the section type name (Worship, Praise, Tithes and offering, Special numbers).
- **Song display** — Shows song title + author in parentheses; optional note text in italics; dimmed styling option for past setlists.

---

## 📂 OG / Social Sharing

### Dynamic Metadata
- **OG metadata generation** — The setlist detail page exports `generateMetadata` that builds Open Graph title and description from the setlist's date, branch, title, and song leader.
- **OG image support** — `@vercel/og` dependency included for potential OG image generation.
- **Site metadata** — Root layout sets title "Agham Setlist", description "Worship team setlist manager", icon `/transparent-logo.svg`.
- **Viewport metadata** — width=device-width, initial-scale=1, themeColor "#252320".

---

## 📂 Public Assets

- **AGHAM logo SVG** — Stylized flame/leaf shape in #D84F0B brand color; used as favicon and header logo.
- **Microphone icon SVG** — Used as inline mask image (via CSS mask) for song leader indicators.
- **Geist font** — Loaded from Google Fonts via `next/font/google` for the entire application.

---

## 📂 Project Configuration

- **TypeScript** — Strict mode enabled; ES2017 target; bundler module resolution; `@/*` path alias mapped to `./*`.
- **Tailwind CSS v4** — PostCSS-based configuration with custom theme colors and CSS variables.
- **ESLint** — Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`; ignores build directories.
- **PostCSS** — Configured with `@tailwindcss/postcss` plugin.
- **Vercel deployment** — Metadata base URL configured for Vercel deployment.
- **Git ignores** — Standard Next.js ignores (node_modules, .next, .env*, .vercel, etc.).

---

## 📂 Developer Experience

- **AGENTS.md** — Placeholder for AI agent instructions.
- **CLAUDE.md** — Indirection file pointing to AGENTS.md.
- **RULES.md** — Coding mentoring rules emphasizing teaching, problem decomposition, and avoiding "vibe coding".
- **Scripts** — `dev` (next dev), `build` (next build), `start` (next start), `lint` (eslint) in package.json.

---

## 📂 Supabase Migration

- **Migration SQL** — Documented schema changes including adding `lyrics`, `default_time_signature`, `default_key`, `default_bpm` to songs; `song_key`, `override_lyrics`, `chord_notes` to setlist_sections; `status`, `chords` to songs.
