# Task 4 — Mount QuickSongLookup between Greeting and Lineups + integration QA (evidence)

Date: 2026-08-11
Executor: opencode (Todo 4, Wave 3 — last implementation todo)
Plan: `.omo/plans/quick-song-lookup.md` Todo 4

## Deliverable

- MODIFIED ONLY: `app/(main)/setlists/_components/SetlistList.tsx` — two additions, nothing else:
  1. `import QuickSongLookup from "./QuickSongLookup";` after the `SetlistPreviewCard` import (line 10).
  2. `<div className="mb-6"><QuickSongLookup /></div>` rendered exactly between `<Greeting />` and the Lineups header `<div className="flex items-center justify-between gap-3 mb-6">`.
- `git diff --stat` for THIS todo = `app/(main)/setlists/_components/SetlistList.tsx | 4 ++++` (4 insertions). The `app/api/songs/route.ts` diff is Todo 1's (pre-existing, not touched this todo). `QuickSongLookup.tsx` is the Todo 2/3 deliverable (untracked, untouched this todo).
- The mount is PERMANENT — not reverted (unlike Todos 2-3 temporary mounts).

## Gates

- `npx tsc --noEmit` — PASS (exit 0, zero errors).
- `npx eslint app/(main)/setlists/_components/SetlistList.tsx` — 1 error, the PRE-EXISTING `react-hooks/set-state-in-effect` at line 124 (`setTodayLocal` in a `useEffect`). Verified identical on the pristine file (stash/pop): 1 problem both before and after my change → ZERO new errors introduced by this todo. (That pre-existing error is in `Greeting`-adjacent effect logic this todo is forbidden to touch.)
- `npx eslint app/(main)/setlists/_components/QuickSongLookup.tsx` — PASS (exit 0, zero errors).

## QA run (Playwright headless Chromium 151, real DB)

Same browser setup as Todos 2/3: local `playwright-core` in `/tmp/opencode/pw` launching cached Chromium with `LD_LIBRARY_PATH=/tmp/opencode/chrome-libs/usr/lib/x86_64-linux-gnu`; `chromium.launch({ executablePath })` so `context.grantPermissions(['clipboard-read','clipboard-write'])` applies.

Auth note: in guest mode `Greeting` renders null (no session → no name), so the DOM-order assertion "greeting text first" was run in an AUTHENTICATED session. Created a temporary QA user via the Supabase admin REST API (`qa.quicklookup.<ts>@setlist.com`, email_confirm true, user_metadata name "QA Tester"), injected the session into localStorage (`sb-wpljxnzdurnqeickolmh-auth-token`) before navigating, ran the assertions, then DELETED the user via the admin API (HTTP 200). DB left clean.

### Scenario 1 — DOM order (authenticated)
- Greeting renders: "Good evening, QA Tester". PASS
- Greeting appears BEFORE the quick-lookup bar. PASS
- Quick-lookup bar (`input[name="quick-lookup-search"]`) appears BEFORE the "Lineups" heading. PASS

### Scenario 2 — Idle footprint = exactly one row
- `document.body.scrollHeight` with widget visible = 991; with widget hidden via `display:none` override on `input[name="quick-lookup-search"]`'s `.relative` wrapper = 941. Difference = +50px (one ~44-50px bar row, `mb-6` wrapper margin collides with the header's mb-6). PASS (40 ≤ 50 ≤ 56).

### Scenario 3 — Overlay (no layout shift)
- Typing "a" opens the dropdown. PASS
- "Lineups" heading `getBoundingClientRect().top` = 196 both before and after (unchanged). PASS
- `document.body.scrollHeight` = 991 before and after (unchanged). PASS
- Result rows capped at 6. PASS

### Scenario 4 — E2E happy path (chords + copy)
- Query "Echo" + Chords toggle → clicked "Echo (In Jesus Name)" → chords expand inline (len 111). PASS
- `fontFamily` computed = `"Courier New", Courier, monospace` (contains Courier). PASS
- Copy button: coordinate click → label swaps to "Copied"; `navigator.clipboard.readText()` = len 111. PASS (used coordinate click per Todo 3 learning; a `locator().filter(hasText).click()` flaked the label swap in the earlier run).

### Scenario 5 — Mobile (iPhone 13: 375x667, deviceScaleFactor 3, isMobile)
- No horizontal overflow: `document.documentElement.scrollWidth` = 375 = viewport width. PASS
- Dropdown opens; panel `max-height` = 400.2px (= 60dvh of 667) with `overflow-y: auto`. PASS
- Toggle Chords + search "God" → expand "God is in the house" (chords len 241, Courier monospace). PASS
- Panel scrolls on content overflow: `scrollHeight` 759 > `clientHeight` 400, `overflow-y: auto`. PASS

### Scenario 6 — Guest session (unauthenticated)
- `localStorage.guest_mode=true`, no auth session token present, widget renders. PASS
- Typing "a" returns results (6 rows). PASS

### Scenario 7 — Clear query restores idle footprint
- Clearing the input → dropdown panel gone. PASS
- Idle footprint back to single row: 941 (hidden) vs 991 (visible), diff 50px. PASS

Total: 23/23 PASS. No page console errors.

## Files touched after QA

- `app/(main)/setlists/_components/SetlistList.tsx` — the permanent deliverable (2 additions).
- QA scripts kept under `/tmp/opencode/pw/` (outside repo). No `.playwright-mcp/`, no stray scripts in `app/`.
- Temporary QA user deleted from Supabase (admin API DELETE → HTTP 200).

## Notepad

Appended to `.omo/notepads/quick-song-lookup/learnings.md` (Todo 4 entry).
