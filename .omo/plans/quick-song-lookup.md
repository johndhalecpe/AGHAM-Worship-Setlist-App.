# quick-song-lookup - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** A compact "Quick lookup" widget on your setlists home page, sitting as ONE slim bar row between your greeting and the Lineups section — a Chords/Lyrics toggle plus a search bar. Typing shows a floating results list OVER the lineups (taking zero extra page space); tapping a song reveals its chords or lyrics right there, with a one-tap copy button.

**Why this approach:** The whole widget is a single ~44px row at rest — the smallest permanent footprint possible — and results render in an absolutely-positioned overlay dropdown, so opening the search never pushes the lineups down the page (the "no extra space" requirement, honored with zero layout shift). It reuses the existing `/api/songs` search endpoint, so there is no new database work — only one tiny, backwards-compatible query-param addition to make chords searchable.

**What it will NOT do:** No song editing (display + copy only, read-only), no changes to the Songs library page or song picker, no new route or page, no new npm dependencies, no DB migrations — and no growth of the home page beyond that single bar row.

**Effort:** Short
**Risk:** Low - small additive read-only widget; one small API param addition; no auth/schema changes

**Decisions to sanity-check:** (1) results appear in an OVERLAY dropdown rather than pushing content (matches your "no extra space" constraint) — the widget is closed by default and shows nothing until you type; (2) toggle defaults to Lyrics (matches current search behavior); (3) making Chords searchable requires adding a `mode=chords` query param to the existing `/api/songs` GET — default behavior is untouched.

Your next move: plan is written and awaiting your explicit okay. Once approved: run `$start-work` to execute, or ask for a high-accuracy review first. Full execution detail follows below.

---

> TL;DR (machine): Short / Low risk / 4 todos — one-row chords|lyrics quick-search widget mounted between Greeting and Lineups on the setlists home page; overlay dropdown results; `/api/songs` gains optional `mode=chords` search; read-only + copy.

## Scope
### Must have
- New `QuickSongLookup` client component at `app/(main)/setlists/_components/QuickSongLookup.tsx` (new file only).
- Mounted inside `SetlistList` (`app/(main)/setlists/_components/SetlistList.tsx`) exactly between `<Greeting />` (line 138) and the Lineups header div (line 139).
- Single compact row at rest: inline Chords | Lyrics segmented toggle + search input, visually consistent with the existing `SongsSearchBar` (rounded-xl, `var(--color-surface-card)` bg, `var(--color-border)` border that turns `var(--color-accent)` on focus, `min-h-[44px]`).
- Results list rendered in an absolutely-positioned dropdown panel (`absolute left-0 right-0 top-full mt-1 z-40`, `max-h-[60dvh] overflow-y-auto`) — the page MUST NOT reflow when it opens.
- Debounced (300ms) server search on the existing `/api/songs` GET; the toggle selects the searched field: `mode=lyrics` (default) searches title/author/lyrics, `mode=chords` searches title/author/chords.
- `/api/songs` GET gains an optional `mode` query param only; `mode=chords` swaps `chords.ilike.%q%` into the existing `.or(...)`; any unknown/absent mode keeps today's exact behavior.
- Selecting a result expands that row inside the dropdown: chords rendered `whiteSpace: pre-wrap`, `fontFamily: 'Courier New', Courier, monospace`, bold, `var(--color-chord-text)`; lyrics rendered `pre-wrap`, `leading-relaxed`, standard text color. A Copy button copies the full field text via `navigator.clipboard` and shows "Copied" for 2s.
- Loading row while fetching, "No songs found" empty row, "Search failed" error row (tertiary/`var(--color-danger)` text); result rows capped at 6.
- Dismiss: Escape key closes the dropdown; clicking outside the widget closes it. Enter opens the first result. Widget is closed (folded to the single bar row, no panel) whenever the query is empty.
- Works for guests (the GET endpoint is public — no auth gate).
- Agent-executed QA for every todo (curl + dev-server browser checks) and the 4-verifier final wave.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- NO editing anywhere in the widget: strictly read-only display, no PATCH/POST/DELETE calls, no chord/lyric textareas, no collaboration hooks (`useSongCollaboration` is out of scope).
- NO changes to the Songs library page, `SongsGroupedView`, `SongsSearchBar`, `SongPicker`, `SongSearchList`, `SongCard`, `ChordsViewer`, `LyricsViewer`, or any file other than the 3 listed above (2 edits + 1 new file).
- NO new npm dependencies (no command-menu/combobox/date libs) — plain React + `fetch` only.
- NO DB migrations, no schema changes, no env changes.
- NO permanent extra vertical space: at rest the widget renders exactly one row; no always-visible panel, no padding/headings beyond the bar row wrapper (`mb-6` on the wrapper).
- NO version bump / no release automation (patch-version-bump is a release-time skill — not triggered by this feature).
- NO changes to the landing page (`app/page.tsx`), admin pages, or auth flows.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: none — the repo has no test framework (codegraph reports no covering tests anywhere); acceptance is proven per todo with `curl` against the running dev server and browser checks via the Playwright skill.
- Evidence: `.omo/evidence/task-<N>-quick-song-lookup.<ext>` (attemptDir outside ulw-loop = `.omo/evidence/`), one file per todo.
- Global gates for F2: `npx tsc --noEmit` passes and `npm run lint` passes (or the repo's configured lint script) with zero new errors.
- QA commands assume `npm run dev` on :3000 with a real Supabase project like the rest of the app; use real song data present in the DB (title/author/lyrics/chords) for curl assertions.

## Execution strategy
### Parallel execution waves
> Small feature (4 todos); waves are sized to the dependency chain.

- Wave 1: Todo 1 (API param) + Todo 2 (component shell — build against the default lyrics path; chords-mode QA runs after Todo 1 is live).
- Wave 2: Todo 3 (content display).
- Wave 3: Todo 4 (mount + integration QA).

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | — | 2 (chords-mode acceptance) | 2 (build) |
| 2 | 1 (chords search QA) | 3 | 1 |
| 3 | 2 | 4 | — |
| 4 | 3 | — | — |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Extend `/api/songs` GET with `mode` param so chords are searchable
  What to do / Must NOT do: In `app/api/songs/route.ts` GET handler (lines 6-35): read `const mode = searchParams.get("mode")`. When `mode === "chords"`, build the `.or(...)` as `` `title.ilike.%${searchTitle}%,author.ilike.%${searchTitle}%,chords.ilike.%${searchTitle}%` ``; for any other value (including absent or unknown like `mode=bogus`) keep the existing lyrics `.or(...)` (lines 17-19) byte-for-byte. Must NOT change the `.select(...)` list (line 13), `.order(...)`, Cache-Control header (line 29), the `revalidatePath`/`revalidateTag` calls, the POST handler (lines 37-70), or any other file.
  Parallelization: Wave 1 | Blocked by: — | Blocks: Todo 2 chords-mode QA
  References (executor has NO interview context - be exhaustive): `app/api/songs/route.ts:6-35` (GET; `.or` at 17-19; select list 13; cache header 29); current search semantics: `components/setlists/song-picker/SongSearchList.tsx:6-11` (title/author/lyrics groups); client callers that MUST keep working unchanged: `lib/hooks/use-songs.ts:11-16` (`/api/songs?search=`), `components/setlists/song-picker/SongPicker.tsx` (via `useSongs`).
  Acceptance criteria (agent-executable): with dev server up and a song whose chords text contains a term T (e.g. "Am") that does NOT appear in its lyrics: `curl 'http://localhost:3000/api/songs?search=T&mode=chords'` returns that song; `curl 'http://localhost:3000/api/songs?search=T'` (no mode) behaves exactly as before; `curl 'http://localhost:3000/api/songs?search=T&mode=bogus'` behaves like the no-mode call. All three return arrays with the same shape as today.
  QA scenarios (name the exact tool + invocation): `curl` (as in acceptance) happy path (mode=chords hit) + failure paths (unknown mode fallback, empty `search` returns full list). Evidence `.omo/evidence/task-1-quick-song-lookup.md`.
  Commit: Y | feat(api): add mode=chords search to /api/songs

- [x] 2. Create `QuickSongLookup` component shell: single-row bar + toggle + overlay dropdown with debounced fetch
  What to do / Must NOT do: Create NEW file `app/(main)/setlists/_components/QuickSongLookup.tsx` (no other file touched in this todo). `"use client"`. State: `mode: "chords" | "lyrics"` (initial `"lyrics"`), `query: string`, `results: Song[]` (from `@/lib/type`), `loading`, `open`. Fetching: `useEffect` on `[query, mode]` with `setTimeout` 300ms debounce; skip entirely when `query.trim() === ""` (set `results=[]`, `open=false`); `AbortController` to cancel in-flight requests on re-run/unmount; URL built as `/api/songs?search=${encodeURIComponent(query)}&mode=${mode}`; on response `setResults(data)`, `setOpen(true)`; on error `setOpen(true)` with an error flag; `.catch(() => {})` for aborts. Render: a `relative` wrapper div; inside it the single bar row matching `SongsSearchBar` visuals exactly (rounded-xl, `px-3 sm:px-4`, `bg var(--color-surface-card)`, `1px solid var(--color-border)`, focus swaps borderColor to `var(--color-accent)`, input `py-2.5 sm:py-3 text-sm bg-transparent outline-none min-h-[44px]`); leading search icon SVG (same heroicon path as `SongsSearchBar.tsx:30-34`); then a segmented toggle as two buttons "Chords" | "Lyrics" (active: `backgroundColor var(--color-accent)`, `color var(--color-text-on-accent)`; inactive: transparent + `var(--color-text-secondary)`); then the text input (`name="quick-lookup-search"`, `autoComplete="off" autoCorrect="off" spellCheck={false} autoCapitalize="off"`, placeholder "Search chords or lyrics..."); clear (x) button when query non-empty (same pattern as `SongsSearchBar.tsx:60-79`). Dropdown panel: rendered only when `open && query.trim() !== ""`, `absolute left-0 right-0 top-full mt-1 z-40 rounded-xl`, `backgroundColor var(--color-surface-card)`, `1px solid var(--color-border)`, `max-h-[60dvh] overflow-y-auto`; rows capped at first 6 of `results`: title (font-medium, truncate), author (`var(--color-text-tertiary)`), key badge `default_key ?? "G"` styled like `var(--color-badge-key)`/`var(--color-badge-key-text)`. States: while loading show a "Searching..." row; on error show a row with the error text in `var(--color-danger)`; when `results.length === 0 && !loading` show "No songs found" in `var(--color-text-tertiary)`. Dismissal: `useEffect` that, when `open`, adds `document` `mousedown` listener closing if the click target is outside the wrapper ref (use a `ref` on the wrapper), and a `keydown` listener closing on Escape; both removed on cleanup. Must NOT: render song content (that is Todo 3), fire anything but a GET, import `SongsSearchBar` (self-contained), add deps, touch other files.
  Parallelization: Wave 1 | Blocked by: Todo 1 (for chords-mode QA only; build works standalone) | Blocks: Todo 3
  References (executor has NO interview context - be exhaustive): visuals to mirror `app/(main)/songs/_components/SongsSearchBar.tsx:10-81`; row/mouseover style precedent `components/setlists/song-picker/SongSearchList.tsx:45-86`; key-badge style `components/setlists/setlist-detail/ChordsViewer.tsx:408-419`; Song type `lib/type.ts` (SongListItem/Song shape: id, title, author, default_key); API + caching behavior `app/api/songs/route.ts:6-35` and `lib/hooks/use-songs.ts:11-16`.
  Acceptance criteria (agent-executable): `npx tsc --noEmit` clean; with dev server up, Playwright: page shows the bar as a single row between greeting and "Lineups"; typing "a" opens the dropdown and `document.body.scrollHeight` is identical before/after opening (zero layout shift); dropdown rows ≤ 6; clearing the input closes the dropdown; Escape closes; clicking outside closes; toggle buttons exist and switch selection state (visual active class); loading row appears during a throttled fetch; guest session (no auth) still gets results.
  QA scenarios (name the exact tool + invocation): Playwright browser QA per the acceptance list (happy) + failure: type gibberish → "No songs found" row; network error (block /api/songs in Playwright route interception) → error row; rapid typing → stale responses ignored (AbortController — assert last keystroke's results win). Because the widget is not yet permanently mounted, QA uses a TEMPORARY mount: add the import + `<div className="mb-6"><QuickSongLookup /></div>` between Greeting and the Lineups header in `SetlistList.tsx`, run the QA, then REVERT that file (`git checkout -- app/\(main\)/setlists/_components/SetlistList.tsx`) and confirm `git diff --stat` shows ONLY `QuickSongLookup.tsx` before committing. If `/api/songs?mode=chords` is not yet live when QA runs (Todo 1 runs in parallel), test the lyrics path and note chords-mode as deferred to Todo 3/4 QA. Evidence `.omo/evidence/task-2-quick-song-lookup.md`.
  Commit: Y | feat(setlists): add quick chords/lyrics lookup bar

- [x] 3. Content display: expand selected song inside the dropdown with chords/lyrics + copy
  What to do / Must NOT do: Still in `app/(main)/setlists/_components/QuickSongLookup.tsx` only. Add `selectedId: string | null` state. Clicking a result row sets `selectedId` (toggle off if same id); the row renders a chevron that rotates (precedent `SetlistPreviewCard.tsx:213-219`). When a row is selected, render below its title row inside the panel: for `mode === "chords"` a block with `whiteSpace: pre-wrap`, `fontFamily: "'Courier New', Courier, monospace"`, `fontWeight: "bold"`, `color: "var(--color-chord-text)"`, `fontSize: 14px`, `padding: 12px`; for `mode === "lyrics"` a block with `whiteSpace: pre-wrap`, `leading-relaxed`, `color: "var(--color-text)"`. Also render a Copy button (icon + label, styled like the copy button in `SetlistPreviewCard.tsx:221-237`): `navigator.clipboard.writeText(fullFieldText)`, label swaps to "Copied" and reverts after 2s (setTimeout cleaned up on unmount/change). Empty field (null/empty string) → render "No lyrics available." / "No chords available." placeholder text in `var(--color-text-tertiary)` (see placeholder precedent `ChordsViewer.tsx:370`). When `query` or `mode` changes, reset `selectedId` to null. Must NOT: make any PATCH/POST/DELETE call, add textareas or contentEditable, edit any other file, reuse `ChordsViewer`/`LyricsViewer` (they are setlist-section-scoped full modals — out of scope).
  Parallelization: Wave 2 | Blocked by: Todo 2 | Blocks: Todo 4
  References (executor has NO interview context - be exhaustive): chord text styles `components/setlists/setlist-detail/ChordsViewer.tsx:371-379`; copy-button pattern `app/(main)/setlists/_components/SetlistPreviewCard.tsx:115-144,221-237`; chevron rotate pattern `SetlistPreviewCard.tsx:213-219`; Song fields returned by the API include full `lyrics` and `chords` already (`app/api/songs/route.ts:13`) — NO additional fetch needed.
  Acceptance criteria (agent-executable): `npx tsc --noEmit` clean; Playwright: click a result → content block appears inside the dropdown with the correct font-family for chords mode / normal for lyrics mode; toast-free "Copied" label swap works and `navigator.clipboard` contains the full text; a song with null chords shows the "No chords available." placeholder; toggling Chords→Lyrics resets the expanded selection; re-typing resets it too.
  QA scenarios (name the exact tool + invocation): Playwright happy (select → content visible → copy → clipboard match) + failure (null-chords placeholder; spam-typing during open row collapses selection). Evidence `.omo/evidence/task-3-quick-song-lookup.md`.
  Commit: Y | feat(setlists): show chords/lyrics inline in quick lookup

- [x] 4. Mount `QuickSongLookup` between Greeting and Lineups + integration QA
  What to do / Must NOT do: In `app/(main)/setlists/_components/SetlistList.tsx`: add `import QuickSongLookup from "./QuickSongLookup";` and render `<div className="mb-6"><QuickSongLookup /></div>` exactly between `<Greeting />` (line 138) and the Lineups header `<div className="flex items-center justify-between gap-3 mb-6">` (line 139). Do NOT alter `Greeting`, the Lineups header, the Schedule link, or any list logic; do NOT add the widget anywhere else (not the songs page, not the landing page, not the header nav).
  Parallelization: Wave 3 | Blocked by: Todo 3 | Blocks: —
  References (executor has NO interview context - be exhaustive): insertion point `app/(main)/setlists/_components/SetlistList.tsx:136-162` (return tree: Greeting 138, Lineups header 139-162); page data flow `app/(main)/setlists/page.tsx:48-51` (server component passes setlists into SetlistList — widget needs no props and must not touch this).
  Acceptance criteria (agent-executable): `npx tsc --noEmit` clean; Playwright on `/setlists`: elements in DOM order are — greeting text, then the quick-lookup bar, then the "Lineups" heading; when idle (no focus/typing) the page shows exactly one extra row of height versus before the change (measure `scrollHeight` with the widget vs. without it hidden via CSS `display:none` override — difference must be a single row); dropdown opens overlaying the Lineups cards without shifting them; still works at mobile width (Playwright `device = 'iPhone 13'` viewport: bar rows wrap correctly, panel `max-h-[60dvh]` scrolls).
  QA scenarios (name the exact tool + invocation): Playwright happy (DOM order + one-row-at-rest + overlay behavior + mobile viewport) + failure (guests: unauthenticated session sees the widget and gets results; clearing query leaves no panel). Evidence `.omo/evidence/task-4-quick-song-lookup.md`.
  Commit: Y | feat(setlists): mount quick lookup on home page

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy
- One commit per todo, conventional format as annotated on each todo (feat(api) / feat(setlists) ×3). Commit as soon as that todo's acceptance passes; do not bundle.
- Push/deploy is NOT part of this plan — when the user asks to ship, the git-pushing skill is loaded in the worker session at that time.

## Success criteria
- `/setlists` home page shows a single-row quick-lookup bar between the greeting and the Lineups header; at rest it adds exactly one row of height to the page.
- Typing opens an overlay dropdown (zero layout shift, ≤6 rows, loading/empty/error states) and the Chords|Lyrics toggle changes which field is searched; `mode=chords` finds songs by chord text, `mode=lyrics` by lyric text — both via the existing endpoint alone.
- Selecting a song shows its chords (monospace, `--color-chord-text`) or lyrics (pre-wrap) inline, with a working Copy button and graceful empty-field placeholders; Escape/click-outside dismiss; works for guests.
- No other file, page, dependency, schema, or behavior changed; `npx tsc --noEmit` and lint pass; final verification wave F1-F4 all APPROVE before handoff.
