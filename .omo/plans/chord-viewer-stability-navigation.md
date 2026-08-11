# chord-viewer-stability-navigation - Work Plan

## TL;DR (For humans)

Three fixes for the setlist song viewers (chords modal + lyrics modal):

1. **Editing stability** — while you type chords, the app never steals focus, scrolls the page, or remounts the editor; incoming refetches merge into the current view instead of replacing it.
2. **Realtime calm** — remote edits from other users are buffered and applied 20 seconds after the last one, never while you're editing, and applied by patching the cache in place — no page refreshes, no focus loss.
3. **Prev/Next navigation** — a sticky bottom bar (previous title / "Song X of Y" / next title) in both the Chords and Lyrics modals; the URL `?song=` param is the single source of truth, neighbors are prefetched for instant switching, and the bar disables at the first/last song.

Implementation: 8 todos in 3 waves (registry → realtime buffering + editing guards → navigation), then a 4-reviewer final verification wave. No test framework exists in the repo, so QA = lint + build + hands-on runtime checks.

## Scope

### In scope
1. **Edit-session stability in the chords modal** (`components/setlists/setlist-detail/ChordsViewer.tsx`): an `editingChordId` session state that, while active, guarantees no scroll stealing, no focus loss, no unmount/remount of the edited block, no `key` prop change on the edited block, and in-place reconciliation of any refetch (mutate → invalidate → refetch cycles merge into existing state instead of replacing the array).
2. **Realtime stability** (`lib/hooks/use-realtime-setlist.ts`): `postgres_changes` UPDATE events are buffered and applied on a trailing-edge 20-second interval; never applied while the local user is editing that scope; applied by patching the react-query cache in place (`setQueryData`) — never via `router.refresh()` or a full reload. INSERT/DELETE events keep their current immediate invalidation (structural changes, not per-keystroke).
3. **Prev/Next song navigation** in the chords modal: sticky bottom bar with previous song title, "Song X of Y", next song title, Previous/Next buttons. Single source of truth = `?song=<songId>` URL query param. Every render derives `currentIndex`, the displayed song, and the prev/next labels from the setlist's ordered song array (`songList[currentIndex - 1 / 0 / +1]`). Next/Previous ONLY update the URL param. Neighbor chord data is prefetched (`GET /api/songs/:id`) and cached in a module-level in-memory Map for the session. Previous disabled at song 1, Next disabled at the last song.
4. **Shared nav component in a separate file** (`components/setlists/setlist-detail/SongNavBar.tsx`) + shared hook (`lib/hooks/use-song-navigation.ts`) so **LyricsViewer implements the same navigation** (single-song lyrics display with the same sticky bar).
5. **SongCard save-path cleanup** (`components/songs/SongCard.tsx`): remove `router.refresh()` from `saveChords` (line 157) — patch local state instead; wire the editing registry while `editingChords` is true.

### Out of scope (Must NOT have)
- Do NOT modify `components/setlists/setlist-detail/SetlistContent.tsx` (its `useEffect([initialSetlist, initialSections])` wholesale replace at lines 38-42 stays; the modal's internal in-place reconciliation makes it inert for the edited node).
- Do NOT modify `lib/hooks/use-song-collaboration.ts` (broadcast/presence/live-preview machinery is untouched).
- Do NOT modify any API route (`app/api/songs/[id]/route.ts`, `app/api/setlists/[id]/sections/route.ts`) — their `revalidatePath`/`revalidateTag` calls stay (tag revalidation alone does not reload an open page).
- Do NOT add dependencies; do NOT install a test framework (repo has none).
- Do NOT change the `songs`/`setlist_sections` schema or any API contract.
- Do NOT key song blocks by index or `currentIndex` — keys stay `s.id` (section row id) everywhere.
- Do NOT add `router.refresh()` anywhere in the chord-save or realtime-apply paths.
- Do NOT store `currentIndex`, `prevSong`, or `nextSong` in state — derive on every render from the URL param + ordered array.
- Do NOT apply buffered realtime UPDATE payloads while the local user is editing that scope.
- Do NOT change the accordion behavior of anything outside the two viewers; LyricsViewer's tap-to-expand accordion IS replaced by the single-song view (adopted decision, user-approved).

## Verification strategy

- Repo has NO test runner (`package.json` scripts: dev/build/start/lint only). Test strategy: **none** — every todo carries agent-executed QA with an evidence path.
- Per-todo gates: `npm run lint` (zero errors) + `npm run build` (exit 0) + the todo's runtime QA scenario.
- Runtime QA runs against `npm run dev` (port 3000) with a logged-in non-guest user; evidence = console/network logs, `document.activeElement` checks, `containerRef.scrollTop` snapshots, screenshots.
- Final verification wave F1-F4 runs after all todos (see section below).

## Execution strategy

### Dependency matrix
- T1 (registry) — prerequisite for T2, T3, T4.
- T2 (realtime hooks) — depends on T1; no file conflict with T3-T8.
- T3 (ChordsViewer stability) — depends on T1; edits `ChordsViewer.tsx` (must run before T7 which edits the same file).
- T4 (SongCard) — depends on T1; independent.
- T5 (nav hook) — independent of T1-T4 (new file).
- T6 (SongNavBar) — depends on T5's return shape (new file).
- T7 (ChordsViewer single-song) — depends on T3 (same file), T5, T6.
- T8 (LyricsViewer single-song) — depends on T5, T6; different file from T7.
- Parallel batches: [T1, T5] → [T2, T3, T4, T6] → [T7, T8] → final wave F1-F4 (parallel).

### Shared conventions (apply to every todo)
- All new files: `"use client";` where hooks/state are used; TypeScript strict; no `any`; no `@ts-ignore`.
- Styling: reuse the existing CSS-variable system (`var(--color-surface)`, `var(--color-border)`, `var(--color-text)`, `var(--color-accent)`, `var(--color-surface-muted)`, `var(--color-text-tertiary)`, `var(--color-badge-key)`, `var(--color-badge-key-text)`) — never hardcode hex colors.
- Touch targets: `min-h-[44px]` on mobile, `sm:min-h-[32px]` on desktop (existing pattern).
- Append findings to `.omo/notepads/chord-viewer-stability-navigation/` (learnings/issues) after each todo.

## Todos

### Wave 1 — Realtime editing registry + buffered realtime hooks

- [x] 1. Create `lib/realtime-editing.ts` — module-level editing registry shared by viewers and realtime hooks
    **TASK**: Create new file `lib/realtime-editing.ts` exporting:
    - `export type RealtimeScope = "songs" | "setlist_sections";`
    - `export function setRealtimeEditing(scope: RealtimeScope, active: boolean): void` — module-scope `Record<RealtimeScope, boolean>` (init `{ songs: false, setlist_sections: false }`).
    - `export function isRealtimeEditing(scope: RealtimeScope): boolean`
    - `export function markLocalWrite(scope: RealtimeScope): void` — sets `lastLocalWriteTs[scope] = Date.now()` (init 0).
    - `export function getLastLocalWriteTs(scope: RealtimeScope): number`
    Plain module (no React), `"use client"` not needed (no hooks; keep it framework-free so both client hooks can import it).
    **REFERENCES**: no existing equivalent (verified by grep — no realtime-editing file). Import sites (created in later todos): `lib/hooks/use-realtime-setlist.ts`, `components/setlists/setlist-detail/ChordsViewer.tsx`, `components/songs/SongCard.tsx`.
    **ACCEPTANCE**: file exists at `lib/realtime-editing.ts`; exports exactly the 5 symbols above; `setRealtimeEditing("songs", true)` flips `isRealtimeEditing("songs")` to `true`; `markLocalWrite("songs")` makes `getLastLocalWriteTs("songs") > 0`; `npm run lint` and `npm run build` pass.
    **QA happy**: `npm run lint` → 0 errors; `npm run build` → exit 0 (evidence: terminal output).
    **QA failure**: remove the `setRealtimeEditing` export → `npm run build` must fail with a type error (evidence: build error output) — proves the module is wired.
    **COMMIT**: `git add lib/realtime-editing.ts && git commit -m "feat: add realtime editing registry"`

- [x] 2. Rewrite `lib/hooks/use-realtime-setlist.ts` — 20s trailing-edge buffering for UPDATE events, editing-skip, in-place cache patch
    **TASK**: Rewrite `useRealtimeSections` (lines 7-36) and `useRealtimeSongs` (lines 38-61) of `lib/hooks/use-realtime-setlist.ts`:
    - Keep the same subscriptions and channel names (`sections:${setlistId}`, `songs:all`) and the same `postgres_changes` filters (`table: "setlist_sections", filter: setlist_id=eq.${setlistId}`; `table: "songs"`, `event: "*"`).
    - Per hook instance, keep a buffer in `useRef`: `{ latest: RealtimePostgresChangesPayload<Record<string, unknown>> | null; timer: ReturnType<typeof setTimeout> | null }`.
    - Handler logic (identical shape in both hooks, scope = `"songs"` for songs, `"setlist_sections"` for sections):
      - `INSERT`/`DELETE` → **immediate** `queryClient.invalidateQueries(...)` exactly as today (songs: `["songs"]`; sections: `["setlists", setlistId, "sections"]` and `["setlists"]`).
      - `UPDATE` → overwrite `buffer.latest` with the payload; clear+reset the timer to 20_000ms (trailing edge). On timer fire:
        1. If `isRealtimeEditing(scope)` → keep the payload in `buffer.latest`, re-arm the timer for another 20_000ms, and return (never apply while the local user edits).
        2. If `!isRealtimeEditing(scope)` → parse `payload.commit_timestamp` (ISO string → `Date.parse`); if it is `<= getLastLocalWriteTs(scope)` → drop (own echo / stale) and clear the buffer. Otherwise **patch in place** via `queryClient.setQueryData`, never invalidate, never `router.refresh()`:
           - songs: `setQueryData<Song[] | undefined>(["songs"], old => old ? old.map(s => s.id === payload.record.id ? { ...s, ...pick(payload.record, ["title","author","category","language","default_key","default_bpm","default_time_signature","status"]) } : s) : old)`.
           - sections: `setQueryData<SetlistSectionWithSong[] | undefined>(["setlists", setlistId, "sections"], old => old ? old.map(sec => sec.id === payload.record.id ? { ...sec, ...pick(payload.record, ["song_id","section_type","sort_order","notes","song_key"]) } : sec) : old)` — the nested `songs` object must survive (`...sec` first, then spread only the picked row fields).
           - sections also: patch `["setlists"]` in place — find the setlist with `id === setlistId` in the array and update its `sections` entry the same way (keep the `SetlistWithSections` shape).
        3. Clear the buffer.
    - Cleanup on unmount: clear the timer (existing `removeChannel` stays).
    - Import `isRealtimeEditing`, `getLastLocalWriteTs` from `@/lib/realtime-editing`; import `Song` and `SetlistSectionWithSong` types from `@/lib/type` for the `setQueryData` generics.
    **REFERENCES**: `lib/hooks/use-realtime-setlist.ts` (whole file, 61 lines); `lib/hooks/use-songs.ts:8` (`SONGS_KEY = ["songs"]`), `:39-45` (`useSongs`); `lib/hooks/use-setlists.ts:8` (`SETLISTS_KEY = ["setlists"]`), `:41-47` (`useSetlists`), `:14-18` (`fetchSetlists` returns `SetlistWithSections[]`); `lib/type.ts:1-14` (`Song`), `:31-54` (`SetlistSectionWithSong`), `:56-58` (`SetlistWithSections`); consumers: `app/(main)/songs/_components/SongsGroupedView.tsx:96` (`useRealtimeSongs()`), `app/(main)/setlists/[id]/SetlistDetail.tsx:25` (`useRealtimeSections(id)`).
    **ACCEPTANCE**: both hooks buffer UPDATEs (no invalidation within 20s of an UPDATE); exactly one in-place patch fires per quiet 20s window; no patch while `isRealtimeEditing(scope)`; INSERT/DELETE invalidate immediately; no `router.refresh()`/`invalidateQueries` call exists in the UPDATE path; `npm run lint` + `npm run build` pass.
    **QA happy**: start `npm run dev`; open `/songs` (SongsGroupedView mounts `useRealtimeSongs`); in a second tab run a songs-table UPDATE (e.g. edit+save a song title through the UI or `supabase.from("songs").update(...)` from a scratch script); verify in DevTools Network that NO `GET /api/songs` refetch happens within 20s, then exactly one happens at ~20s after the last event (evidence: network log timestamps + screenshot).
    **QA failure**: while a chords textarea is focused in the setlist modal (`isRealtimeEditing("songs") === true`), fire a songs UPDATE from tab 2; verify the cache patch is deferred: no patch/re-render of the modal content until the field blurs AND the next 20s tick (evidence: `document.activeElement` unchanged + modal DOM unchanged during the window).
    **COMMIT**: `git add lib/hooks/use-realtime-setlist.ts && git commit -m "fix: buffer realtime UPDATE events with 20s trailing-edge and skip while editing"`

### Wave 2 — Editing stability

- [x] 3. Add edit-session stability to `components/setlists/setlist-detail/ChordsViewer.tsx` — `editingChordId` guards + in-place refetch reconciliation
    **TASK**: In `components/setlists/setlist-detail/ChordsViewer.tsx` (keep ALL existing features — drafts, queued saves, collaboration, KeyPicker, zoom):
    1. Add `const [editingChordId, setEditingChordId] = useState<string | null>(null);` (line ~57 area, next to `focusedFieldRef`).
    2. In `renderChordsTextarea` `onFocus` (lines 225-234): keep existing behavior (past/guest blur checks, `focusedFieldRef`, `setFocusedInput(true)`, 300ms `scrollIntoView`) and ADD `setEditingChordId(s.id)` + `setRealtimeEditing("songs", true)`. In `onBlur` (235-238): ADD `setEditingChordId(null)` + `setRealtimeEditing("songs", false)`.
    3. KeyPicker session: when `editingKeyId` is set (button onClick line 279) → `setRealtimeEditing("setlist_sections", true)`; when cleared (after `handleKeyChange` line 108, KeyPicker `onCancel` line 402, backdrop click line 388) → `setRealtimeEditing("setlist_sections", false)`. Use a `useEffect([editingKeyId])` that sets the registry accordingly — single place.
    4. `markLocalWrite("songs")` after a successful chords PATCH in `saveChordField` (after line 131 `if (!res.ok)` guard); `markLocalWrite("setlist_sections")` after successful key PATCH in `handleKeyChange` (after line 99 guard).
    5. **In-place reconciliation**: add `const [internalSections, setInternalSections] = useState(sections);` and a `useEffect` on `sections` (the prop): merge the incoming array into the internal one **per entry** — for each incoming section: if `chordEdits[`${sec.id}-chords`]` is defined (active draft) keep the internal entry's `songs.chords`; if the section's key is being edited (`editingKeyId === sec.id`) keep the internal `song_key`; otherwise take the incoming entry. Preserve object identity of unchanged entries (only replace entries that actually differ). Render `filtered` from `internalSections` (line 42-45). Keep `onSectionsChange` propagation exactly as-is.
    6. Scroll guard: introduce `const editingRef = useRef(false);` kept in sync with `editingChordId` (assign in the same places as 2.); NO programmatic scroll call (`scrollIntoView`/`scrollTo`/scrollTop writes) may execute while `editingRef.current === true` — the only scroll writes in the component are the existing focus-time `scrollIntoView` (user-initiated) and any nav-time reset added in T7.
    7. Keys: song blocks keep `key={s.id}` (line 365) and the textarea keeps `name={fieldKey}` — do NOT introduce index/`currentIndex` keys.
    **REFERENCES**: `components/setlists/setlist-detail/ChordsViewer.tsx` (lines 41-61 state; 63-91 collab; 93-109 key change; 111-142 saveChordField; 157-165 handleChordsChange; 204-257 renderChordsTextarea; 259-298 renderSongHeader; 300-407 render, key at 365); `lib/realtime-editing.ts` (T1); `components/setlists/setlist-detail/SetlistContent.tsx:38-42` (parent replace effect — intentionally NOT modified).
    **ACCEPTANCE**: while `editingChordId !== null`: (a) typing never loses focus, (b) `containerRef` scrollTop is never written by the component, (c) the edited textarea's DOM node identity (`document.activeElement` and its parent `div[key]`) is unchanged across re-renders, (d) incoming `sections` prop changes merge in place (draft text preserved, unchanged entries keep identity); `setRealtimeEditing` flips correctly on focus/blur and KeyPicker open/close; lint+build pass.
    **QA happy**: dev server; open a setlist detail page → Chords modal → focus a chords textarea → type 20+ chars rapidly; verify `document.activeElement === textarea` and `containerRef.scrollTop` unchanged after each keystroke (console assertions via DevTools), draft text present (screenshot before/after).
    **QA failure**: with the textarea focused, trigger a `sections` prop change from outside (simulate refetch: in tab 2 edit the same setlist's song title via the edit form — `onSectionsChange`/parent state changes propagate); verify focus retained, no remount (DOM node identity check), draft text intact (evidence: console + screenshot).
    **COMMIT**: `git add components/setlists/setlist-detail/ChordsViewer.tsx && git commit -m "fix: guard chord edit sessions against scroll/focus/remount and reconcile refetches in place"`

- [x] 4. Clean `components/songs/SongCard.tsx` save path — remove `router.refresh()`, wire editing registry
    **TASK**: In `components/songs/SongCard.tsx`:
    1. In `saveChords` (lines 139-158): DELETE `router.refresh()` (line 157). The local state is already patched by `setFullData` (line 153) and the server cache is revalidated by the API route (`app/api/songs/[id]/route.ts` PATCH revalidates tags/paths — untouched). After the `res.ok` branch, ADD `markLocalWrite("songs")` and `setRealtimeEditing("songs", false)` (editing session ends on save).
    2. Set the registry whenever the chords editor is open: replace the direct `setEditingChords(...)` calls' registry side-effect with one `useEffect(() => { setRealtimeEditing("songs", editingChords); return () => setRealtimeEditing("songs", false); }, [editingChords])`.
    3. `handleDeleteConfirm` (line 83) keeps its `router.refresh()` (delete = structural; unchanged).
    4. If `useRouter` is now only used by `handleDeleteConfirm`, keep the import (still used).
    **REFERENCES**: `components/songs/SongCard.tsx` lines 32-47 (state), 109-129 (handleShowChords sets editingChords), 131-137 (draft change), 139-158 (saveChords + router.refresh at 157), 73-84 (delete), 310-364 (editing UI); `lib/realtime-editing.ts` (T1); `app/api/songs/[id]/route.ts:84-88` (revalidation stays).
    **ACCEPTANCE**: `saveChords` contains no `router.refresh()`; saving chords triggers NO RSC/full-page refetch (network log shows only the PATCH + its revalidation); registry is `true` exactly while `editingChords` is true and `false` otherwise; lint+build pass.
    **QA happy**: /songs page → open chords editor on a card → Save; verify in Network tab: only `PATCH /api/songs/:id` (no `?_rsc=` reload, no router.refresh); card shows saved chords without page reload (screenshot).
    **QA failure**: open chords editor → verify `isRealtimeEditing("songs") === true` (console import check or registry probe), cancel editor → verify `false`; then a songs-table UPDATE from tab 2 while editing → no cache patch applied (evidence: console + network logs).
    **COMMIT**: `git add components/songs/SongCard.tsx && git commit -m "fix: stop router.refresh on chord save; wire realtime editing registry"`

### Wave 3 — Navigation

- [x] 5. Create `lib/hooks/use-song-navigation.ts` — URL query param as the single source of truth
    **TASK**: Create new file `lib/hooks/use-song-navigation.ts` exporting:
    - `export const SONG_NAV_PREFETCH_CACHE = new Map<string, Song>();` — module-level in-memory session cache of prefetched songs (`id` → full song incl. `chords`).
    - `export function useSongNavigation(orderedSongs: SongListItem[], initialSongId?: string | null): UseSongNavigationReturn` where:
      ```ts
      interface UseSongNavigationReturn {
        currentSong: SongListItem | null;   // derived: orderedSongs[currentIndex]
        currentIndex: number;               // derived: clamp(matchIndex, 0, len-1)
        prevSong: SongListItem | null;      // derived: orderedSongs[currentIndex - 1] ?? null
        nextSong: SongListItem | null;      // derived: orderedSongs[currentIndex + 1] ?? null
        hasPrevious: boolean;               // currentIndex > 0
        hasNext: boolean;                   // currentIndex < orderedSongs.length - 1
        goPrevious(): void;                 // ONLY: replace ?song=<prevSong.id>
        goNext(): void;                     // ONLY: replace ?song=<nextSong.id>
      }
      ```
    - Reading: `const searchParams = useSearchParams();` `const songParam = searchParams.get("song");` — the URL param is the single source of truth. `useState(() => songParam ?? initialSongId ?? orderedSongs[0]?.id)` seeds an internal `currentSongId`; a `useEffect([songParam])` syncs `currentSongId` when `songParam` changes (back/forward or manual URL edits); when `songParam` is null and `currentSongId` is set, `useEffect` writes `replace(`?song=${currentSongId}`, { scroll: false })` once (initial seed) — no pushState, no scroll, no navigation object.
    - Writing: `goPrevious`/`goNext` compute the target id from `prevSong`/`nextSong` (derived from `currentIndex`) and call `replace(`?song=${targetId}`, { scroll: false })`. `router.replace` with `scroll: false` does NOT remount or refetch — the param change re-renders, and the modal's own prefetch cache supplies chord data.
    - `useSearchParams` requires a Suspense boundary: the hook (and the viewers in T7/T8) will render inside `<Suspense>` in their callers if needed — check `app/(main)/songs/_components/SongsGroupedView.tsx:89` (existing `useSearchParams` usage) for the established boundary pattern and mirror it.
    - `useRouter` from `next/navigation`; `replace` only — never `push`.
    **REFERENCES**: `app/(main)/songs/_components/SongsGroupedView.tsx:89-99` (existing useSearchParams + Suspense pattern); `lib/type.ts:1-14` (`Song`), `:16-29` (`SongListItem`); T7/T8 import sites.
    **ACCEPTANCE**: no state variables named `currentIndex`/`prevSong`/`nextSong` in this file (all derived); only `replace` with `scroll: false` used; initial seed writes `?song=` exactly once when absent; param changes re-derive everything; lint+build pass.
    **QA happy**: dev-server: open the chords modal URL with `?song=<id2>` → displays song 2; Prev → URL becomes `?song=<id1>`, song 1 renders (no full reload — Network shows no RSC refetch); back button → song 2 again (evidence: URL + song title + network log).
    **QA failure**: URL has `?song=<nonexistent-id>` → falls back to `orderedSongs[0]` and rewrites the URL to the first song's id (evidence: URL bar).
    **COMMIT**: `git add lib/hooks/use-song-navigation.ts && git commit -m "feat: URL-driven song navigation hook with prefetch cache"`

- [x] 6. Create `components/setlists/setlist-detail/SongNavBar.tsx` — shared sticky bottom nav bar (separate file, reused by LyricsViewer)
    **TASK**: Create new file `components/setlists/setlist-detail/SongNavBar.tsx`:
    - Props: `{ currentSong: SongListItem | null; prevSong: SongListItem | null; nextSong: SongListItem | null; hasPrevious: boolean; hasNext: boolean; currentIndex: number; totalCount: number; onPrevious: () => void; onNext: () => void; }` — pure presentational, NO hooks, NO URL logic (the hook lives in the caller).
    - Sticky bar: `position: sticky; bottom: 0` (or `fixed bottom-0` if the modal scroll container needs it — pick per the modal's layout, matching the modal's z-index and background so content scrolls under it cleanly); `min-h-[44px]` (mobile) / `sm:min-h-[32px]`; flex row: [Previous button] [center block: prev song title (tertiary text) / "Song {currentIndex+1} of {totalCount}" (secondary)] [Next button]. Buttons: `min-w-[96px]`, disabled state when `!hasPrevious` / `!hasNext` (`disabled:opacity-40`, `disabled:pointer-events-none`). Titles truncated with `truncate` + `max-w-[40vw]`.
    - Styling: CSS variables only (see shared conventions); no new dependencies; no emojis.
    **REFERENCES**: `components/setlists/setlist-detail/ChordsViewer.tsx:300-407` (modal container/layout + z-index), `:373-387` (existing key change / footer button row pattern); T5 hook return shape.
    **ACCEPTANCE**: bar renders prev title / "Song X of Y" / next title correctly for any index (incl. index 0 and last → disabled states); sticky within the modal's scroll container; lint+build pass.
    **QA happy**: mount via ChordsViewer (T7) — scroll the songs list; bar stays visible at the bottom of the modal viewport (screenshot); at song 1, Previous is `disabled` (screenshot + DOM check); at last song, Next is `disabled`.
    **QA failure**: click Next/Previous at boundaries → handler NOT called (`disabled` buttons); DOM check `disabled` attribute present.
    **COMMIT**: `git add components/setlists/setlist-detail/SongNavBar.tsx && git commit -m "feat: shared sticky song navigation bar"`

- [x] 7. Convert ChordsViewer to single-song view with nav — `?song=` param, prefetch neighbors, sticky SongNavBar
    **ADOPTED CHANGE (user, post-T7)**: the modal keeps the FULL scrollable list of all songs in the section (original behavior); the SongNavBar's Previous/Next only SCROLLS to the adjacent song's block (`songRefs` + `scrollIntoView` on `currentIndex` change) — it does NOT swap the whole view to a single card. URL `?song=` remains the source of truth for the bar's "Song X of Y" and boundary states.
    **TASK**: In `components/setlists/setlist-detail/ChordsViewer.tsx` (AFTER T3 — same file):
    1. Props: add `setlist: Setlist | null` (id + songs order source). Derive `orderedSongs: SongListItem[]` from `sections` (the loaded prop): flat map of all songs in `sectionType` order — sections are already ordered by `section_order`/`sort_order` server-side (the modal's `filtered` logic at lines 42-45 filters the passed sections; use the SAME filtered+ordered array the current "all songs" view uses).
    2. Replace the "all songs of sectionType" rendering with single-song rendering: `const { currentSong, currentIndex, prevSong, nextSong, hasPrevious, hasNext, goPrevious, goNext } = useSongNavigation(orderedSongs, /* initialSongId from URL */);` — render ONLY `currentSong`'s block (key stays `currentSong.id`), plus the SongNavBar (T6) at the bottom: `<SongNavBar currentSong={currentSong} prevSong={prevSong} nextSong={nextSong} hasPrevious={hasPrevious} hasNext={hasNext} currentIndex={currentIndex} totalCount={orderedSongs.length} onPrevious={goPrevious} onNext={goNext} />`.
    3. When `goPrevious`/`goNext` change the URL, `useSongNavigation` re-derives `currentSong`; the song block swaps. T3's edit-session guards must make this swap safe for the editor: if `editingChordId !== null` and the user navigates, the edit session ends (blur fires → `setEditingChordId(null)`); ensure the draft for the OLD song is still saved (the queued save in `handleChordsChange`/`saveChordField` is per-song keyed by id — it survives; verify the save completes before the block unmounts — if the block would unmount mid-save, flush the queue in `goPrevious`/`goNext` before `replace` — implement by calling the existing save function for the current song if `chordEdits[`${currentSong.id}-chords`]` is dirty, then `replace`).
    4. Keep `songDetails`/`fetchedSongs` state (lines 46-50, 95-98) for the OTHER songs' chords: when `currentSong.id` changes, if `fetchedSongs` lacks it, prefetch `GET /api/songs/${currentSong.id}` (existing `fetchSongDetails` path or reuse) — and prefetch `prevSong.id`/`nextSong.id` too; store results in `SONG_NAV_PREFETCH_CACHE` (T5) AND in local `fetchedSongs` so render is instant. Chords for the current song render from `fetchedSongs[currentSong.id]?.chords ?? currentSong.chords` — never from the URL cache alone.
    5. `useSearchParams` Suspense: if `useSongNavigation` needs it, wrap the modal's inner component (or the caller at `SetlistSections.tsx:501` / `SetlistPreviewCard.tsx:661` if simpler) in `<Suspense>` per the established pattern (T5 references).
    6. Do NOT change: `handleChordsChange`, `saveChordField`, `handleKeyChange`, collaboration (useSongCollaboration), `onSectionsChange`, `onClose`, `KeyPicker`.
    7. Callers (SetlistSections.tsx:501, SetlistPreviewCard.tsx:661) must pass the new `setlist` prop — check both call sites and update; `SetlistPreviewCard` has `setlist` available (it renders the card for a setlist); `SetlistSections` receives sections + setlistId (verify prop availability; if the full setlist is unavailable there, pass the ordered songs array instead — see the type used).
    **REFERENCES**: `components/setlists/setlist-detail/ChordsViewer.tsx` (T3-modified), `lib/hooks/use-song-navigation.ts` (T5), `components/setlists/setlist-detail/SongNavBar.tsx` (T6), `app/(main)/setlists/[id]/SetlistDetail.tsx` (setlist availability), `components/setlists/setlist-detail/SetlistSections.tsx:501` (call site), `app/(main)/setlists/_components/SetlistPreviewCard.tsx:661` (call site), `lib/type.ts` (`Setlist`, `SongListItem`).
    **ACCEPTANCE**: modal shows ONE song at a time; nav bar switches songs via URL-only updates (no reload, no RSC refetch — Network log proves only the `?song=` param change + prefetch GETs); neighbors prefetched into `SONG_NAV_PREFETCH_CACHE`; boundaries disable correctly; dirty draft flushed before navigation; all T3 guarantees still hold; lint+build pass.
    **QA happy**: open modal → song A; click Next → URL `?song=B`, song B renders instantly (prefetched), no page reload (Network: no `_rsc` requests except prefetch GETs); chords of B render from cache (screenshot); scroll to bottom → bar sticky (screenshot).
    **QA failure**: while editing song A's chords (dirty draft), click Next → draft flushed (PATCH fired) BEFORE B renders; A's draft is re-applied if you navigate back (evidence: network PATCH log + draft text restored screenshot).
    **COMMIT**: `git add components/setlists/setlist-detail/ChordsViewer.tsx components/setlists/setlist-detail/SetlistSections.tsx 'app/(main)/setlists/_components/SetlistPreviewCard.tsx' && git commit -m "feat: single-song chords view with URL-driven navigation"`

- [x] 8. Convert LyricsViewer to single-song view with the same nav
    **ADOPTED CHANGE (user, post-T8)**: same as T7 — the lyrics accordion list (tap-to-expand) is restored in full; the SongNavBar scrolls to the adjacent song's block instead of replacing the view.
    **TASK**: In `components/setlists/setlist-detail/LyricsViewer.tsx`:
    1. Props: add `setlist: Setlist | null` (same as T7); keep `sections`, `sectionType`, `onClose`.
    2. Replace the accordion (`useState<Record<string, boolean>>` expanded logic) with single-song rendering: same `useSongNavigation(orderedSongs, ...)` call as T7; render `currentSong`'s lyrics (title + `chords` textarea/preview — the existing lyrics rendering pieces, extracted from the accordion body) + `<SongNavBar ...>` (T6) at the bottom of the modal.
    3. Same prefetch wiring as T7 (4) — reuse `SONG_NAV_PREFETCH_CACHE`.
    4. No edit-session guards needed for lyrics (read-only display) — keep `markLocalWrite`/registry untouched in this file (it has none).
    5. Caller: `SetlistSections.tsx` — update the LyricsViewer call site (verify which line renders it; likely near line 501 with the ChordsViewer call) to pass `setlist`.
    **REFERENCES**: `components/setlists/setlist-detail/LyricsViewer.tsx` (whole file — accordion state + render), T5/T6/T7 for hook/bar/prefetch patterns, `components/setlists/setlist-detail/SetlistSections.tsx` (call site).
    **ACCEPTANCE**: lyrics modal shows one song; nav switches songs (URL-driven, no reload); bar sticky; boundaries disabled; lint+build pass.
    **QA happy**: open lyrics modal → song A; Next → song B, no reload (Network log); scroll → bar sticky (screenshot).
    **QA failure**: navigate to last song → Next disabled; navigate back and forth quickly 10x → URL stays in sync with rendered song every step (evidence: URL + title screenshots).
    **COMMIT**: `git add components/setlists/setlist-detail/LyricsViewer.tsx components/setlists/setlist-detail/SetlistSections.tsx && git commit -m "feat: single-song lyrics view with shared navigation"`

## Final verification wave

- [ ] F1. **Goal/constraint reviewer (oracle)** — APPROVE/REJECT: read the final code; verify every user requirement is met: no scroll/focus/remount steal while editing (T3), no `router.refresh()` in any chord-save/realtime path (grep `router.refresh` in `ChordsViewer.tsx`, `SongCard.tsx`, `use-realtime-setlist.ts`), 20s trailing-edge buffering with editing-skip and in-place patch (T2), URL param as single source of truth + no next/prev state variables (grep `useState` in `use-song-navigation.ts` — only `currentSongId` allowed), separate `SongNavBar` file reused by BOTH viewers, boundaries disabled, prefetch cache in play.
- [ ] F2. **Code quality reviewer (oracle)** — APPROVE/REJECT: TypeScript strict, no `any`/`@ts-ignore`, no dead code (grep unused imports), no duplicated nav logic between viewers (both consume T5/T6), no hardcoded hex colors in changed files, files stay under 250 LOC of pure logic where feasible.
- [ ] F3. **Security reviewer (oracle)** — APPROVE/REJECT: no new server routes; URL param is only used client-side to index an existing array (no injection surface); no changes to RLS posture, auth, or API validation; no secrets added.
- [ ] F4. **Hands-on QA executor (unspecified-high)** — APPROVE/REJECT: run the app against a dev server and the existing test data; execute the T2/T3/T7/T8 "QA happy" and "QA failure" scenarios end-to-end (buffered realtime, editing stability under refetch, nav at boundaries, sticky bar, URL sync); report PASS/FAIL per scenario with evidence.

## Commit strategy

- One atomic commit per todo (exact commands given in each todo's COMMIT line), in wave order.
- Do NOT run the git skill / git-master in a worker session before T1's commit — worker executes commits itself per todo.
- No branch creation requested; commit directly on the current branch (check `git status` first — never commit unrelated dirty files; stage only the listed paths).

## Success criteria (Definition of Done)

1. All 8 todos and F1-F4 land as `- [x]` with evidence in `.omo/notepads/chord-viewer-stability-navigation/`.
2. `npm run lint` exit 0 and `npm run build` exit 0 on the final tree.
3. Runtime QA (F4) passes: chord editing never loses focus/scrolls/remounts under refetch; realtime UPDATEs arrive ~20s after last edit-burst, never while the local user edits; Next/Prev navigate via `?song=` only, no page reload, boundaries disabled; LyricsViewer has the same nav from the shared `SongNavBar`.
4. User-visible behavior matches the request: "the active editor's own view should always reflect their local edits immediately", no `router.refresh()` anywhere in the save/realtime paths, nav derived from the URL param + ordered array only.

