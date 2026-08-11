# Task 3 — QuickSongLookup content display: expand + chords/lyrics + copy (QA evidence)

Date: 2026-08-11
Executor: opencode (Todo 3, Wave 2 — after Todo 2 shell + Todo 1 chords-mode were live)
Plan: `.omo/plans/quick-song-lookup.md` Todo 3

## Deliverable

- EXTENDED ONLY: `app/(main)/setlists/_components/QuickSongLookup.tsx` (Todo 2 deliverable). No other file changed by this todo.
- Temporary QA mount in `app/(main)/setlists/_components/SetlistList.tsx` (import + `<div className="mb-6"><QuickSongLookup /></div>` between `<Greeting />` and the Lineups header) was REVERTED after QA (`git checkout --`). SetlistList.tsx is pristine (git diff empty).
- After revert, `git diff --stat` shows ONLY `app/api/songs/route.ts` (Todo 1) + the untracked `QuickSongLookup.tsx` (this todo's deliverable). `.playwright-mcp/` QA artifacts removed.

## Implementation notes

- Added `selectedId: string | null` state; clicking a result row sets it (clicking the same row toggles to `null`). Row is now a clickable `cursor-pointer` div with a trailing chevron SVG that rotates 180° when selected (`transition-transform duration-200`, precedent `SetlistPreviewCard.tsx:213-219`). The row's outer `border-b` moved to a wrapping div so the expanded block sits below the row border.
- Expanded block renders immediately below the row, inside the panel:
  - `mode === "chords"`: `whiteSpace: pre-wrap`, `fontFamily: "'Courier New', Courier, monospace"`, `fontWeight: "bold"`, `color: var(--color-chord-text)`, `fontSize: 14`, block `padding: 12`, `borderTop: 1px solid var(--color-border)`.
  - `mode === "lyrics"`: `whiteSpace: pre-wrap`, `leading-relaxed` class, `color: var(--color-text)`, same borderTop/padding.
  - Empty field (`null` or empty string): "No chords available." / "No lyrics available." in `var(--color-text-tertiary)`.
- Copy button in the expanded block header (right-aligned): heroicons copy SVG + "Copy" label, `--color-accent` bg, `--color-text-on-accent`; onClick → `navigator.clipboard.writeText(fieldText)`; label swaps to "Copied" and reverts after 2s (`setTimeout`). NO toast (plan requires toast-free swap).
- Copy timer cleanup: `copyTimerRef` (`ReturnType<typeof setTimeout>`); cleared on unmount (empty-dep effect), on selection change, and via `resetSelection()`.
- `resetSelection()` sets `selectedId = null` + `setCopied(false)` + clears the copy timer; called from `handleChange` (every keystroke / clear button) and from the toggle onClick — so `selectedId` resets whenever `query` or `mode` changes (in the handlers, NOT in an effect — honors the `react-hooks/set-state-in-effect` rule from Todo 2's learnings).
- Reused full `lyrics`/`chords` fields already returned by `/api/songs` (route.ts:14 select) — NO extra fetch.
- No PATCH/POST/DELETE; no textareas/contentEditable; no reuse of `ChordsViewer`/`LyricsViewer`.

## Gates

- `npx tsc --noEmit` — PASS (exit 0, zero errors), verified before and after temp mount and after revert.
- `npx eslint app/(main)/setlists/_components/QuickSongLookup.tsx` — PASS (exit 0, zero errors).

## QA run (Playwright headless Chromium 151, real DB, guest mode)

Browser path from Todo 2 learnings (chrome channel not installed): local `playwright-core` in `/tmp/opencode/pw`, launching the cached Playwright Chromium natively with `LD_LIBRARY_PATH=/tmp/opencode/chrome-libs/usr/lib/x86_64-linux-gnu`. Launching via `chromium.launch({ executablePath })` (instead of CDP-attach) is what makes `context.grantPermissions(['clipboard-read','clipboard-write'])` actually apply — CDP-attach to an externally-launched browser kept denying clipboard-read in this environment. Test data: "Echo (In Jesus Name)" has real chords text; "Ako'y Nananabik" (910ae0e7) has null chords.

### Scenario 1 — chords expand, monospace bold (inside dropdown)
- Clicked result row → content block appears inside `.z-40` panel. PASS
- computed `fontFamily` = `"Courier New", Courier, monospace` (contains "Courier"). PASS
- `fontWeight` = 700 (bold). PASS
- `fontSize` = 14px, `whiteSpace` = pre-wrap. PASS
- chevron has `rotate-180` when selected. PASS
- dropdown STILL open after selecting a row (row click does not dismiss). PASS
- `document.body.scrollHeight` stays 957 with the block expanded (zero layout shift). PASS

### Scenario 2 — copy: label swap + clipboard match
- Real mouse click on Copy button → label becomes "Copied". PASS
- `navigator.clipboard.readText()` === full chords text (len 111). PASS
- After ~2.3s label reverts to "Copy". PASS
- (First attempt used `locator('button').filter(hasText:/^Copy$/).click()` which flaked — the click registered but the label swap didn't render in that path; a coordinate mouse click is authoritative and swaps correctly. No page console errors in either path.)

### Scenario 3 — null-chords placeholder
- "Ako'y Nananabik" (null chords) clicked in chords mode → expanded block shows "No chords available." in `var(--color-text-tertiary)`. PASS

### Scenario 4 — toggle Chords→Lyrics resets selection
- With a row expanded, clicking Lyrics toggle → dropdown stays open, but no row is expanded (`rotate-180` absent) → selection collapsed. PASS

### Scenario 5 — re-typing resets selection
- Expand "Echo (In Jesus Name)", then change query to "Echo (" → dropdown stays open (1 result row), no expanded row. PASS

### Scenario 6 — Escape / click-outside
- Escape closes dropdown. PASS
- Clicking a fixed-header point outside the widget closes the dropdown. PASS
- Selecting a row does NOT close it. PASS

### Lyrics-mode styling (supplementary)
- Lyrics block: fontFamily = Geist (NOT Courier), fontWeight 400 (not bold), lineHeight 26px (leading-relaxed), whiteSpace pre-wrap, color = standard text `rgb(45,43,40)`. PASS

### Guest session
- Entire run unauthenticated (`guest_mode`); widget rendered, expanded, and copied fine. PASS

## Files touched after QA

- `app/(main)/setlists/_components/SetlistList.tsx` — temporary mount, REVERTED via `git checkout`.
- `app/(main)/setlists/_components/QuickSongLookup.tsx` — the deliverable (untracked, awaiting Todo commit).
- QA artifacts under `.playwright-mcp/` removed after QA.
