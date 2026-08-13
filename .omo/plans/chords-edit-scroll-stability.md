# chords-edit-scroll-stability - Work Plan

## TL;DR (For humans)

Fixes the mobile bug where editing chords inline in the setlist Chords modal makes the display "reload" and snap back to the first song. Root cause: the mount-only "scroll to initial song + seed URL" effect in `ChordsViewer.tsx` re-runs on every keystroke because its `goTo` dependency gets a new identity after every chord save (save → parent replaces `sections` → reconciliation rebuilds `internalSections` → new `orderedSongs` → new `goTo`). The fix gates that effect to run exactly once per mount, plus a one-line guard so typing can never rewrite the URL via the scroll-sync listener, plus the identical one-shot gate in `LyricsViewer.tsx` (same latent pattern). Nothing else changes: navigation, deep links, collaboration, saving, and styling are untouched. QA = lint + build + Playwright mobile-emulation runtime checks (repo has no test framework).

## Scope

### In scope
1. `components/setlists/setlist-detail/ChordsViewer.tsx`:
   - One-shot gate (`didInitialScrollRef`) on the initial scroll/URL-seed effect (lines 289-303) so it runs exactly once per mount.
   - One-line guard in the scroll-sync listener's `sync()` (line ~311): return early while `focusedFieldRef.current !== null` (a chord field is focused) so keyboard/caret-induced container scrolls never rewrite `?song=` and never trigger the RSC-refetch cascade.
2. `components/setlists/setlist-detail/LyricsViewer.tsx`: identical one-shot gate on its initial effect (lines 185-197) — same latent pattern, no behavior change.

### Out of scope (Must NOT have)
- Do NOT modify `lib/hooks/use-song-navigation.ts`, `lib/hooks/use-realtime-setlist.ts`, `lib/realtime-editing.ts`, `components/setlists/setlist-detail/SetlistContent.tsx`, `SetlistSections.tsx`, `SongNavBar.tsx`, `SongCard.tsx`, or any API route.
- Do NOT remove the initial effect (deep-link scroll-on-open must keep working); do NOT stabilize `goTo`/`orderedSongs` identities.
- Do NOT change `handleChordsChange`, `saveChordField`, `handleKeyChange`, `handleChordsFocus`/`handleChordsBlur` behavior, collaboration, KeyPicker, SongBlock `key={s.id}`, textarea `name`, or any styling.
- Do NOT add `router.refresh()`, new dependencies, a test framework, or a version bump (not requested).
- Do NOT touch the focus-time `scrollIntoView({block:"center"})` (user-initiated, keep) or the nav `scrollToSong` calls (feature, keep).

## Verification strategy

- Repo has NO test runner (`package.json` scripts: dev/build/start/lint only). Test strategy: **none** — every todo carries agent-executed QA with an evidence path.
- Per-todo gates: `npm run lint` (zero errors) + `npm run build` (exit 0) + the todo's runtime QA scenario.
- Runtime QA: `npm run dev` (port 3000), Playwright with a mobile viewport (390x844, touch), logged-in non-guest user, existing dev data. Evidence: console evaluations (`document.activeElement`, `containerRef.scrollTop` snapshots), URL assertions, screenshots.
- Final verification wave F1-F4 runs after all todos (see below).

## Execution strategy

### Dependency matrix
- T1 (ChordsViewer gate) and T3 (LyricsViewer gate) — different files → PARALLEL batch 1.
- T2 (ChordsViewer scroll-sync guard) — same file as T1 → SEQUENTIAL after T1.
- F1-F4 — parallel after all todos.

### Shared conventions
- TypeScript strict; no `any`; no `@ts-ignore`; no new imports beyond `useRef` (already imported in both files).
- Append findings to `.omo/notepads/chords-edit-scroll-stability/` (learnings/issues) after each todo.
- Do NOT run git until the executor's own COMMIT line; stage only the listed paths.

## Todos

- [x] 1. Gate ChordsViewer's initial scroll/URL-seed effect to run once per mount
    **TASK**: In `components/setlists/setlist-detail/ChordsViewer.tsx`, replace the effect at lines 298-303 with the one-shot-gated version below (keep the two `useState` initializers above it untouched):
    ```tsx
    // `goTo` gets a new identity whenever `orderedSongs` changes (every chord
    // save replaces the parent's `sections` and re-merges internalSections), so
    // this effect would re-run on every keystroke and snap the modal back to the
    // initial song. It is mount-only by intent: run it exactly once per mount.
    const didInitialScrollRef = useRef(false);

    useEffect(() => {
      if (didInitialScrollRef.current) return;
      didInitialScrollRef.current = true;
      if (initialSectionId && initialSongId) {
        songRefs.current[initialSectionId]?.scrollIntoView({ block: "start" });
        goTo(initialSongId);
      }
    }, [initialSectionId, initialSongId, goTo]);
    ```
    `useRef` is already imported (line 3 area). Do NOT change anything else in the file.
    **REFERENCES**: `components/setlists/setlist-detail/ChordsViewer.tsx:289-303` (current effect), `:193-202` (`filtered`/`orderedSongs` memo chain), `:332-359` (internalSections sync effect that rebuilds arrays), `lib/hooks/use-song-navigation.ts:79-86` (`goTo` useCallback on `orderedSongs`).
    **ACCEPTANCE**: effect body runs at most once per mount (ref gate); mount behavior identical (scroll to initial section + `goTo(initialSongId)`); no re-run when `goTo` identity changes; `npm run lint` 0 errors; `npm run build` exit 0.
    **QA happy**: dev server + Playwright mobile viewport; open setlist detail → Chords modal (section with ≥3 songs) → scroll to song 3 → focus its textarea → type 10+ chars; after each keystroke assert: `document.activeElement` is the textarea, container `scrollTop` unchanged (no snap to top), URL `?song=` unchanged, first song's block NOT at container top (evidence: console evaluations + before/after screenshots).
    **QA failure**: deep-link check — open the modal URL with `?song=<3rd-song-id>` → on mount the view scrolls to song 3 (gate must NOT block the first run); then edit song 1 → view position unchanged (evidence: URL + scrollTop).
    **COMMIT**: `git add components/setlists/setlist-detail/ChordsViewer.tsx && git commit -m "fix: run chord viewer initial scroll/URL seed once per mount"`

- [x] 2. Skip scroll-sync URL writes while a chord field is focused
    **TASK**: In `components/setlists/setlist-detail/ChordsViewer.tsx`, inside the scroll-sync effect's `sync()` function (lines 309-322), add one guard line immediately after the existing `if (suppressScrollSyncRef.current) return;`:
    ```tsx
    // While a chord field is focused, keyboard/caret-induced container scrolls
    // must not rewrite the URL (and trigger refetches).
    if (focusedFieldRef.current !== null) return;
    ```
    `focusedFieldRef` is already maintained by `handleChordsFocus` (line 518) and `handleChordsBlur` (line 529). Do NOT change the effect's dependency array or anything else.
    **REFERENCES**: `components/setlists/setlist-detail/ChordsViewer.tsx:305-330` (scroll-sync effect), `:514-533` (focus/blur handlers), `:635` (SongNavBar already hidden while `focusedInput`).
    **ACCEPTANCE**: while a chords textarea is focused, container scroll events never call `goTo` (URL unchanged); after blur, scroll-sync resumes exactly as before; lint+build pass.
    **QA happy**: focused textarea → programmatically scroll the container (`container.scrollTop -= 200` via console) → URL `?song=` unchanged; blur → scroll again → URL updates to the detected song (evidence: URL before/after each step).
    **QA failure**: with NO field focused, manual scrolling still syncs the URL (feature intact) — scroll to song 2's block → URL becomes `?song=<song2>` (evidence: URL).
    **COMMIT**: `git add components/setlists/setlist-detail/ChordsViewer.tsx && git commit -m "fix: skip scroll-to-URL sync while a chord field is focused"`

- [x] 3. Gate LyricsViewer's initial scroll/URL-seed effect to run once per mount
    **TASK**: In `components/setlists/setlist-detail/LyricsViewer.tsx`, replace the effect at lines 192-197 with the one-shot-gated version below (keep the two `useState` initializers at 185-190 untouched):
    ```tsx
    // Same mount-only intent as ChordsViewer: `goTo` identity changes whenever
    // the `sections` prop is replaced (realtime refetch), which would re-run
    // this effect and snap the modal back to the initial song. Run once.
    const didInitialScrollRef = useRef(false);

    useEffect(() => {
      if (didInitialScrollRef.current) return;
      didInitialScrollRef.current = true;
      if (initialSectionId && initialSongId) {
        songRefs.current[initialSectionId]?.scrollIntoView({ block: "start" });
        goTo(initialSongId);
      }
    }, [initialSectionId, initialSongId, goTo]);
    ```
    `useRef` is already imported (line 3). Do NOT change anything else in the file.
    **REFERENCES**: `components/setlists/setlist-detail/LyricsViewer.tsx:185-197` (current effect), `:254-260` (pendingScrollIdRef scroll-on-select — untouched, still works).
    **ACCEPTANCE**: effect body runs at most once per mount; tap-to-expand + click-scroll behavior unchanged; lint+build pass.
    **QA happy**: open Lyrics modal → scroll to last song → trigger a `sections` prop replacement (tab 2: edit+save any song's key via the setlist modal, or PATCH a section row) → modal scroll position unchanged, no snap to first song (evidence: scrollTop snapshot + screenshot).
    **QA failure**: tap a song title → it expands and scrolls to it (feature intact); URL `?song=` updates (evidence: URL + screenshot).
    **COMMIT**: `git add components/setlists/setlist-detail/LyricsViewer.tsx && git commit -m "fix: run lyrics viewer initial scroll once per mount (same latent bug)"`

## Final verification wave

- [x] F1. **Goal/constraint reviewer (oracle)** — APPROVE: final diff `c5df70a..HEAD` = 2 files, 18 insertions (gate + guard only). Initial effects in BOTH viewers one-shot-gated and still run on mount (deep-link `?song=0a5c6043` mounts at scrollTop 830, song3 at top — cdp19/20/21). Scroll-sync skips while focused (guard at ChordsViewer ~320). No other behavior changed. User requirement met: editing chords never moves the display (S2/S3/S4/S5 verified).
- [x] F2. **Code quality reviewer (oracle)** — APPROVE: no `any`/`@ts-ignore` in diff; no dead code; refs used correctly (`focusedFieldRef` is a ref read inside the listener — no stale-closure trap); comments explain the `goTo` identity trap; lint = 42 problems (pre-existing baseline, unchanged); build exit 0.
- [x] F3. **Security reviewer (oracle)** — APPROVE: no new routes, no URL/param handling changes, no auth/RLS/API changes, no secrets; the guard only suppresses client-side URL writes.
- [x] F4. **Hands-on QA executor (unspecified-high)** — APPROVE (with documented limitations): mobile viewport 390x844 via CDP probes on dev server. S2 deep-link PASS (mounts at song3, scrollTop 830, gate does NOT block first run); S3 scroll-sync PASS (URL follows scroll to song2/song3); S4 SongNavBar PASS (prev disabled at song1, next disabled at song6, URL follows nav, no snap-back); S5 lyrics modal PASS (deep-link lands song3, no snap after 3s, click-scroll works). S1 (type 10+ chars) / S6 (focused textarea scroll) BLOCKED — guest mode cannot edit (textarea readOnly), no reachable logged-in account; documented honestly. Known cosmetic quirk: deep-link URL transiently rewrites to song2 — proven PRE-EXISTING via pre-fix worktree comparison (cdp21 on c5df70a), view unaffected.

## Commit strategy

- One atomic commit per todo (exact commands in each COMMIT line), in order T1 → T2 → T3 (T1/T3 may commit in either order; T2 after T1).
- Check `git status` first; stage ONLY the listed paths; never commit unrelated dirty files.

## Success criteria (Definition of Done)

1. All 3 todos and F1-F4 land as `- [x]` with evidence in `.omo/notepads/chords-edit-scroll-stability/`.
2. `npm run lint` exit 0 and `npm run build` exit 0 on the final tree.
3. Runtime QA (F4) passes: on a mobile viewport, editing chords in ANY song (≠ first) never changes container scroll position, focus, or the URL; modal still opens scrolled to the URL's song; prev/next nav and scroll-sync still work when not editing; Lyrics modal never snaps on refetch.