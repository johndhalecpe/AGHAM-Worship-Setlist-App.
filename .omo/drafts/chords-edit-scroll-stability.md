# Draft: chords-edit-scroll-stability

- slug: `chords-edit-scroll-stability`
- intent: **clear**
- review_required: **false** (no review modifier requested)
- classification: **Trivial/Standard boundary** (1 file primary, 1 file consistency, ~10 lines total; no new files, no API/service changes)
- status: **awaiting-approval**
- script note: scaffold-plan.mjs not executable in this session (no shell tool); draft + plan hand-built with the same shape (same as the previous session's draft note).

## Request (user, condensed)

"Determine what's causing the display bug in mobile when editing the chords inline: the display reloads and goes back to the first song, so when editing any song besides the first, the display changes (annoying). Make it so editing doesn't affect the display at all — but also don't break other features."

## Baseline (prior shipped work this builds on)

`.omo/plans/chord-viewer-stability-navigation.md` is COMPLETE (all todos `[x]`) and its output is live in the code:
- `lib/realtime-editing.ts` — editing registry (verified: ChordsViewer/SongCard call `setRealtimeEditing`, `markLocalWrite`).
- `lib/hooks/use-realtime-setlist.ts` — buffered realtime hooks (out of scope here).
- `lib/hooks/use-song-navigation.ts` — URL-driven nav, `?song=` single source of truth.
- `components/setlists/setlist-detail/SongNavBar.tsx` — shared nav bar.
- `ChordsViewer.tsx` — full scrollable list (nav SCROLLS to neighbors, does NOT swap views), `internalSections` in-place reconciliation, `useSongNavigation`, scroll-sync effect.
- `LyricsViewer.tsx` — full list + tap-to-expand, same `useSongNavigation` + initial-scroll effect.

## Root cause (fully traced in current code)

`components/setlists/setlist-detail/ChordsViewer.tsx` lines 289-303:

```tsx
const [initialSectionId] = useState(currentSectionId);
const [initialSongId] = useState(() => ...);

useEffect(() => {
  if (initialSectionId && initialSongId) {
    songRefs.current[initialSectionId]?.scrollIntoView({ block: "start" });
    goTo(initialSongId);
  }
}, [initialSectionId, initialSongId, goTo]);
```

Written as mount-only, but `goTo` is `useCallback(..., [orderedSongs, router])` (use-song-navigation.ts:79-86) and `orderedSongs` is re-memoized whenever `internalSections` gets a new array (ChordsViewer.tsx:193-202, 332-359). Cascade, per keystroke while editing:

1. Keystroke → `handleChordsChange` → `setChordEdits` + queued PATCH `saveChordField` → `onSectionsChange` → parent `SetlistContent.handleSectionsChange` → `setSections(newArray)` → new `sections` prop.
2. `internalSections` sync effect (332-359, deps include `sections`) merges → NEW `internalSections` array → new `filtered` (193) → new `orderedSongs` (202) → **new `goTo` identity**.
3. Effect 298-303 re-runs (dep `goTo` changed) → `scrollIntoView({block:"start"})` on the INITIAL (first) section + `goTo(initialSongId)` rewrites `?song=<first>` →
   **the modal container visibly snaps back to the first song and the URL resets — every keystroke.** Focus/blur transitions after the first save also re-trigger it (`editingChordId` is a sync-effect dep).

Website confirms: `useRealtimeSections`/`SetlistContent` replace `sections` wholesale on refetch; every `goTo` → `router.replace` → RSC refetch → more prop churn. The visible jump is 100% the effect 298-303 `scrollIntoView`; nothing else writes container scroll (verified: only scroll writes in the file are this effect, focus-time `scrollIntoView(center)` (user-initiated, keep), and nav `scrollToSong`).

LyricsViewer.tsx lines 192-197 has the IDENTICAL effect (same latent bug) but no inline-editing trigger → not user-affected today; fix the same 1-shot gate for consistency (zero behavior change there).

Secondary churn (not visible, hardening): during typing, keyboard/caret-induced container scrolls fire the scroll-sync listener (305-330) → `goTo(detected)` URL writes + RSC refetch loop. `focusedFieldRef` is already maintained and the SongNavBar is hidden while focused (`!focusedInput`, line 635) — so skipping sync while focused loses zero visible behavior.

## Topology (components ledger)

| id | component | one-line outcome | status |
|----|-----------|------------------|--------|
| C1 | ChordsViewer initial-scroll effect | runs exactly once per mount; no snap-back on save/focus/blur | pending |
| C2 | ChordsViewer scroll-sync | no URL writes while a chord field is focused (typing can't churn URL/refetch) | pending |
| C3 | LyricsViewer initial-scroll effect | same 1-shot gate (identical latent pattern) | pending |
| C4 | QA + verification | lint/build clean; Playwright mobile-emulation repro proves no scroll/focus/URL change while editing + features intact | pending |

## Decisions adopted (defaults — user may veto in approval reply)

1. **Fix = one-shot gate** (`didInitialScrollRef`), NOT removing the effect and NOT stabilizing `goTo`. Removing the effect regresses deep-link behavior (opening the modal with `?song=<n>` scrolls to song n on mount — the URL is the source of truth per the shipped nav); stabilizing `goTo` is not possible without deeper refactoring of `internalSections` identity flow. The gate preserves mount-time behavior and kills the re-runs.
2. **Scroll-sync focused-skip** via the existing `focusedFieldRef` (set in `handleChordsFocus`, cleared in `handleChordsBlur`) — one guard line in `sync()`. Zero visible feature loss: SongNavBar is already hidden while focused.
3. **LyricsViewer gets the identical 1-shot gate** — same latent bug, no editing trigger, zero behavior change. Keeps both viewers symmetric (they already share the nav hook/bar).
4. **Scope lock**: only the two viewer files change. `use-song-navigation.ts`, `SetlistContent.tsx`, `SetlistSections.tsx`, realtime hooks, API routes, collaboration, SongBlock keys (`s.id`), textarea names, save/queue logic, KeyPicker, SongNavBar — all untouched.
5. **Test strategy: none** (repo has no test runner; package.json: dev/build/start/lint). QA = `npm run lint` + `npm run build` + agent-executed Playwright mobile-emulation runtime checks per todo.
6. **No version bump** (user did not request a release/bump — patch-version-bump skill does not trigger).

## Approval gate

Approach: (T1) ChordsViewer one-shot gate for the initial effect — the fix for the reported bug; (T2) ChordsViewer scroll-sync focused-skip — hardening so typing never churns the URL/refetch; (T3) LyricsViewer one-shot gate — consistency; (T4-F4) verification wave (lint/build + Playwright mobile repro + final reviewers). One file per commit, atomic.

Next action after approval: create `.omo/plans/chords-edit-scroll-stability.md` (scaffold shape), run Mandatory Metis gap analysis, APPEND todos, fill TL;DR last.