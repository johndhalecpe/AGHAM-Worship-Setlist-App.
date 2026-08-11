
## Todo 1 (2026-08-11) — mode=chords on /api/songs

- Added `const mode = searchParams.get("mode")` and branched the existing `.or(...)`: `mode === "chords"` searches title/author/chords; anything else (absent, `lyrics`, `bogus`) keeps the exact legacy title/author/lyrics string — so all existing callers (`useSongs`, `SongPicker`) are unaffected with zero client changes.
- Supabase `.or()` is case-insensitive (`ilike`), so short chord probes like `Bm` surface many songs (12 hits incl. those matching title/author, e.g. an author containing the substring). Pick a distinctive chord token for QA hits.
- `Bm` also matches English words via substring ("su**bm**ission") — chords text is concatenated with lyrics in the same `.or()`, so a token can still hit a legacy song through a coincidental lyric substring. That is legacy behavior, not a regression.
- Interesting: chords value is free-form text (Nashville numbers `1-4-5`, key letters `Bm`, `sus`, slash chords `F#/Bb`), so no normalization was attempted here — out of scope.
- Revalidation (`revalidatePath`/`revalidateTag`) is only called on POST; GET is public + cached `public, max-age=60, stale-while-revalidate=300`. Kept intact.

## Todo 2 (2026-08-11) — QuickSongLookup component shell

- ESLint `react-hooks/set-state-in-effect` (new React hooks rule) rejects ANY synchronous setState in an effect body — including the classic "reset state when input empty" pattern. Fix: move immediate state transitions (clear-on-empty / start-loading / open) into the event handlers (`handleChange`, toggle onClick, clear onClick); keep the effect body to a bail-early `if (trim === "") return;` + the debounced fetch. Behavior is identical, file lints clean.
- Focus border swap: the focus/blur handlers can't use the `borderRef` pattern here (SongsSearchBar uses a ref on its own div); this component's bar div has no ref, so `e.currentTarget.closest("div")` grabs the bar row. Works because the input is the only control that takes focus in the bar.
- The dropdown intercepts clicks over the Lineups heading (it sits at z-40 over the content) — that's by design (overlay), but it means "click outside" QA must click a control NOT covered by the panel (e.g. the fixed header) rather than the heading underneath.
- Zero-layout-shift assertion: `document.body.scrollHeight` was 957 both before typing and with the dropdown open — the absolute-positioned panel adds no page height. Good cheap regression probe.
- Playwright MCP on this machine defaults to the `chrome` channel which is NOT installed and sudo is unavailable; `apt download` libnspr4/libnss3/libasound2t64 → `dpkg-deb -x` into a scratch dir + `LD_LIBRARY_PATH` + launch cached Chromium with `--remote-debugging-port` is a working sudo-free path to a real browser; then drive it via Playwright MCP `cdp_url`.
- `/setlists` is behind `RequireAuth`: anonymous sessions need `localStorage.guest_mode=true` before navigating, else they bounce to the landing page. Remember to set it in QA browser sessions.
- `fill('a')` after the input already contains `a` does NOT reopen the dropdown (React no-ops an unchanged controlled value → handleChange still runs but state doesn't change). To re-trigger a search during QA, backspace first or change the value.

## Todo 3 (2026-08-11) — content display: expand + chords/lyrics + copy

- Row structure change: the row's `border-b last:border-b-0` moved OFF the clickable row div onto a wrapping `<div key>` so the expanded block can sit below the row border as a sibling (`row.nextElementSibling` in QA). The clickable row itself is now `cursor-pointer` with the trailing chevron; the block is the sibling, NOT a child of the row, so clicking the block/Copy does not toggle the row.
- `resetSelection()` (selectedId=null + copied=false + clear copy timer) lives in the event handlers (`handleChange`, toggle onClick), NOT in an effect — same `react-hooks/set-state-in-effect` constraint as Todo 2. Copy timer is a `copyTimerRef` (`ReturnType<typeof setTimeout>`) cleared on unmount via an empty-dep effect (cleanup only, no setState → lint-safe).
- ESLint is fine with a `setTimeout` ref cleanup effect because the effect body does NOT call setState synchronously.
- QA gotcha: Playwright `locator(...).filter({hasText}).click()` flaked on this button (click registered, clipboard wrote, but the label re-render didn't surface in that code path) while a plain coordinate `page.mouse.click(center)` works reliably. For copy-label swap assertions, click via coordinates/bounding-box, then assert the button text.
- Bigger environment note: CDP-attach to an externally-launched headless Chromium will NOT honor `context.grantPermissions(['clipboard-read','clipboard-write'])` — `navigator.clipboard.readText()` keeps throwing "Read permission denied". The fix is to launch the cached Chromium natively via `chromium.launch({ executablePath })` from a local `playwright-core` install (npm i playwright-core into /tmp/opencode/pw) and grant permissions on that managed context. Same libs dir / LD_LIBRARY_PATH as before.
- Placeholder text shares the block container with the Copy button, so `block.textContent` reads "CopyNo chords available." — assert the exact-text content div, not the whole block.
- Assertions that return `null` (e.g. `panel.querySelector('[class*=rotate-180]')`) must be normalized to boolean before comparing (`!!x`), or the collapse tests fail spuriously.
- Toggle Chords→Lyrics re-fetches (mode in the URL) AND collapses the selection via the toggle onClick's `resetSelection()` — both happened in QA scenario 4.

## Todo 4 (2026-08-11) — permanent mount + integration QA

- Permanent mount is exactly 2 additions in `SetlistList.tsx`: the `import QuickSongLookup from "./QuickSongLookup";` and `<div className="mb-6"><QuickSongLookup /></div>` between `<Greeting />` and the Lineups header. `git diff --stat` for this todo = 4 insertions, one file.
- The idle-footprint probe (hide via `display:none` on the `.relative` wrapper) measured +50px visible-vs-hidden (991 vs 941) — matches the ~44-50px single-row expectation. The `mb-6` wrapper margin collapses with the Lineups header's `mb-6`, so the diff is just the bar row.
- Overlay probe: typing "a" keeps the Lineups heading `top` at 196 (unchanged) and `scrollHeight` at 991 (unchanged) — the absolutely-positioned panel adds no page height.
- Greeting DOM-order assertion: `Greeting` renders null for guests (no session → no name), so the "greeting first" check needs an AUTHENTICATED session. Got one by creating a throwaway user via the Supabase admin REST API (`/auth/v1/admin/users`, `email_confirm: true`), then injecting the session JSON into localStorage under `sb-<project-ref>-auth-token` before navigating (`page.evaluate` after first goto, then a real `page.goto`). This works without touching the login UI. DELETE the user after (admin API DELETE → 200) to leave the DB clean.
- Playwright `locator().filter({hasText}).textContent()` after a click can read stale text in the copy-swap assertion; re-querying the button text inside the panel via `page.evaluate` is authoritative.
- Mobile scroll probe: 6 capped rows do NOT overflow a 400px (60dvh) panel; to prove `max-h-[60dvh]` scrolling, expand a long-chords song ("God is in the house", chords len 241) → scrollHeight 759 > clientHeight 400. The 60dvh computed max-height = 400.2px on a 375x667 iPhone 13 viewport.
- Mobile search targeting: search "God" (not "a") so the long-chords song lands in the first 6 result rows.
