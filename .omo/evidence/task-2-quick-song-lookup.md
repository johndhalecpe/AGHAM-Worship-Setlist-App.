# Task 2 — QuickSongLookup component shell (QA evidence)

Date: 2026-08-11
Executor: opencode (Todo 2, Wave 1 — ran in parallel with Todo 1, which was already live in the tree)
Plan: `.omo/plans/quick-song-lookup.md` Todo 2

## Deliverable

- NEW file only: `app/(main)/setlists/_components/QuickSongLookup.tsx` (~170 lines).
- Temporary QA mount in `app/(main)/setlists/_components/SetlistList.tsx` (import + `<div className="mb-6"><QuickSongLookup /></div>` between `<Greeting />` and the Lineups header) was REVERTED after QA.
- After revert, `git diff --stat` shows ONLY `app/api/songs/route.ts` (Todo 1, not this todo) plus the new untracked `QuickSongLookup.tsx`. SetlistList.tsx is back to pristine.

## Implementation notes

- State: `mode` (default `"lyrics"`), `query`, `results: Song[]`, `loading`, `error`, `open`.
- Debounced fetch: `useEffect` on `[query, mode]`, `setTimeout` 300ms, `AbortController` cancelled on cleanup (stale responses dropped), URL `/api/songs?search=${encodeURIComponent(query)}&mode=${mode}`.
- ESLint `react-hooks/set-state-in-effect` (new React hooks rule) flags ANY synchronous `setState` in an effect body. The immediate "reset on empty query / start loading" state transitions were moved OUT of the effect into the `handleChange` input handler and the toggle/clear onClick handlers; the effect body now only bails early when `query.trim() === ""` and otherwise schedules the debounced fetch. This kept the same behavior and produced a lint-clean file.
- Bar row mirrors `SongsSearchBar`: rounded-xl, `px-3 sm:px-4`, surface-card bg, 1px border, focus swaps borderColor to accent (via `closest("div")` on focus/blur), input `py-2.5 sm:py-3 text-sm bg-transparent outline-none min-h-[44px]`, leading heroicon search SVG (same path), clear (x) button when query non-empty.
- Segmented toggle: two buttons "Chords" | "Lyrics" in a `rounded-lg p-0.5` pill; active = accent bg + text-on-accent, inactive = transparent + text-secondary. Toggling to the non-empty query re-fires a `mode=chords` fetch.
- Dropdown: `absolute left-0 right-0 top-full mt-1 z-40 rounded-xl`, surface-card bg + 1px border, `max-h-[60dvh] overflow-y-auto`; first 6 results as rows (title font-medium truncate, author in tertiary, key badge `default_key ?? "G"` in `--color-badge-key`/`--color-badge-key-text`, font-mono), hover uses `--color-surface-elevated` (precedent `SongSearchList.tsx:45-86`).
- States: "Searching..." (loading), "Search failed" (`--color-danger`, error), "No songs found" (tertiary). Rendered only while `open && query.trim() !== ""`.
- Dismissal: document `mousedown` (close when click outside `wrapperRef`) + `keydown` Escape; listeners registered only while open, cleaned up on unmount.

## Gates

- `npx tsc --noEmit` — PASS (exit 0, zero errors), before and after temp mount, and after revert.
- `npx eslint app/(main)/setlists/_components/QuickSongLookup.tsx` — PASS (exit 0, zero errors).

## QA run (Playwright over CDP headless Chromium 151)

The Playwright MCP is configured for the `chrome` channel which is not installed and `sudo` is unavailable.
Workaround used: extracted `libnspr4`/`libnss3`/`libasound2t64` from Ubuntu `apt-get download` .debs into
`/tmp/opencode/chrome-libs`, launched the cached Playwright Chromium with `LD_LIBRARY_PATH` pointing there and
`--remote-debugging-port=9222`, then drove it via the Playwright MCP `cdp_url` connection.
`/setlists` requires guest mode: set `localStorage.guest_mode=true` (RequireAuth.tsx redirects anonymous sessions otherwise).

Scenarios (all on http://localhost:3000/setlists, real DB):

1. **Single-row bar renders** — snapshot shows one bar row (f2e29) with Chords/Lyrics toggle + input `name="quick-lookup-search"` + placeholder "Search chords or lyrics...", sitting between the (empty, guest) Greeting and the "Lineups" heading. PASS.
2. **Typing opens dropdown, zero layout shift** — baseline `document.body.scrollHeight` = 957; after typing "a" and the dropdown opening with results, `scrollHeight` = 957. Identical → no reflow. PASS.
3. **Rows capped at 6** — query "a" (121 API hits) renders exactly 6 key badges (E, E, E, D, D, …). PASS.
4. **Clearing input closes** — clear (x) button sets query empty, input value "", dropdown gone, scrollHeight 957. PASS.
5. **Escape closes** — dropdown closes, query retained. PASS.
6. **Click-outside closes** — clicking the header "Open menu" button (outside wrapper) closes the dropdown; the dropdown also intercepted clicks over the Lineups heading, proving it overlays content (z-40) rather than pushing it. PASS.
7. **Toggle switches active state + chords mode** — default active = Lyrics (accent bg `rgb(216,79,11)`, white text), Chords inactive (transparent, secondary). Clicking Chords flips it; network log shows `GET /api/songs?search=a&mode=chords => 200`. Chords mode IS live (Todo 1 merged in parallel) → not deferred. PASS.
8. **Gibberish → "No songs found"** — typing `zzzzzqqqqq` → panel text "No songs found", 0 rows, scrollHeight 957. PASS.
9. **Network error → error row** — `page.route('**/api/songs**', abort)` → panel text "Search failed", 0 rows. PASS.
10. **Rapid typing → last keystroke wins (AbortController)** — routed first request (search=a) with a 1000ms delay returning marker `STALE-FIRST-RESULT`, second request (search=ab) returning `FRESH-LAST-RESULT` immediately; after both settle the panel shows only `FRESH-LAST-RESULT fresh author D`. The aborted stale response did not overwrite. PASS.
11. **Loading row** — routed request delayed 1500ms: panel shows "Searching..." during flight, then the empty/result state after. PASS.
12. **Guest session** — whole run was unauthenticated (`guest_mode`), widget rendered and returned results. PASS.

## Chords-mode status

`/api/songs?mode=chords` is live (Todo 1 committed to the tree before this todo's QA). `curl http://localhost:3000/api/songs?search=a&mode=chords` returned 200 with 118 hits. Tested end-to-end in the browser (scenario 7). Not deferred.

## Files touched after QA

- `app/(main)/setlists/_components/SetlistList.tsx` — temporary mount, REVERTED via `git checkout`.
- `app/(main)/setlists/_components/QuickSongLookup.tsx` — the deliverable (untracked, awaiting Todo commit).
- QA artifacts under `.playwright-mcp/` removed after QA.
