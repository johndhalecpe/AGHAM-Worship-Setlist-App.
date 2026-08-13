# chords-edit-scroll-stability — Learnings & Evidence

## [2026-08-13] Task: T1-T3 implementation + F1-F4 final wave

### Root cause (confirmed)
The mount-only "scroll to initial song + seed URL" effect in `ChordsViewer.tsx`
re-ran on every keystroke because `goTo` gets a new identity whenever
`orderedSongs` changes (every chord save replaces the parent's `sections` →
reconciliation rebuilds `internalSections` → new `orderedSongs` → new `goTo`).
Each re-run snapped the modal back to the initial song. Same latent pattern in
`LyricsViewer.tsx`.

### Fix (committed)
- `fae20e1` — ChordsViewer: `didInitialScrollRef` one-shot gate on the initial
  scroll/URL-seed effect + `focusedFieldRef.current !== null` guard in the
  scroll-sync `sync()` (no URL rewrite while a chord field is focused).
- `3e779df` — LyricsViewer: identical one-shot gate.
- Final diff `c5df70a..HEAD`: 2 files, 18 insertions, nothing else.

### Verification evidence
- Lint: 42 problems (29 errors, 13 warnings) = pre-existing baseline
  (ChordsViewer hits at 267/286/288/456/490/522/525/539/546; LyricsViewer zero).
- Build: exit 0. Dev server :3000 serves /setlists 200.
- Runtime (CDP probes, mobile 390x844, guest mode):
  - S2 deep-link `?song=0a5c6043` (song3): view mounts at scrollTop 830, song3
    at top — gate does NOT block first run. PASS.
  - S3 scroll-sync: scrolling updates URL to song2/song3. PASS.
  - S4 SongNavBar: prev disabled at song1, next disabled at song6 (last),
    URL follows navigation, no snap-back. PASS.
  - S5 lyrics modal: deep-link lands at song3, no snap-back after 3s,
    click-driven scroll works. PASS.
  - S1 (type 10+ chars) / S6 (focused textarea scroll -> URL stable): BLOCKED —
    guest mode cannot edit (textarea readOnly), no reachable logged-in account.

### S2 URL quirk (pre-existing, root-caused, NOT the fix)
Deep link `?song=0a5c6043` transiently rewrites URL to song2 (fd323b81) ~600ms
after mount. Proven PRE-EXISTING via pre-fix worktree comparison (cdp21 on
`c5df70a` at :3001): same song2 write occurs on unmodified code. Mechanism:
seed/invalid-id effect in `use-song-navigation.ts` (lines 47/63) firing during
transient hydration ordering (song3 temporarily absent from `orderedSongs` ->
writes `orderedSongs[0].id`). Neither writer is touched by the fix. View stays
at song3 (scrollTop 830) throughout — URL-only cosmetic, no visual snap.
Caveat: pre-fix self-corrects URL back to song3 (un-gated effect re-runs);
post-fix final URL stays song2 (the gate blocks the correction re-run). No
visual impact; documented as known cosmetic quirk.

### Constraints honored
Only ChordsViewer.tsx + LyricsViewer.tsx changed. `use-song-navigation.ts`,
`use-realtime-setlist.ts`, `realtime-editing.ts`, SetlistContent.tsx,
SetlistSections.tsx, SongNavBar.tsx, SongCard.tsx, API routes untouched.
No `router.refresh()`, no new deps, no test framework, package.json version
stays 0.1.5.

### Environment gotchas
- Subagent delegation broken (all `task()` calls time out) — verification done
  directly via CDP probes (`/tmp/opencode/cdp*.mjs`).
- Pre-fix comparison needed a real node_modules copy: Next.js rejects symlinked
  node_modules pointing outside the filesystem root; `cp -al` hardlink copy
  works (same filesystem).
- React dev stack elides all app frames -> stacks cannot identify the calling
  component; only "effect body" vs "rAF/scroll event" distinction is reliable.
- CDP: send `Page.enable` + `Runtime.enable` BEFORE
  `Page.addScriptToEvaluateOnNewDocument`.
