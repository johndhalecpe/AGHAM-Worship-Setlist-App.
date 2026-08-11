# Draft: chord-viewer-stability-navigation

- slug: `chord-viewer-stability-navigation`
- intent: **clear**
- review_required: **false** (no review modifier requested)
- classification: **Standard** (4-8 files, one feature area: chord/lyrics viewers + realtime hooks)
- status: **awaiting-approval**
- script note: scaffold-plan.mjs not executable in this session (no shell tool); draft hand-built with the same shape.

## Request (user, condensed)

1. Editing stability in the chord viewer: while `isEditing` (editingChordId) — no scroll stealing, no focus loss, no unmount/remount of the edited node; never change the `key` prop of the edited block; reconcile any mutate → invalidate → refetch into existing state in place (no array replacement / list re-render from scratch).
2. Realtime stability: `postgres_changes` UPDATE events must NOT be applied immediately; buffer the latest payload, apply on trailing-edge 20s; only for non-editing users; active editor's local edits win; no `router.refresh()`/full reload — patch local state in place.
3. Prev/Next navigation: sticky bottom bar in the chord viewer (prev title, "Song X of Y", next title, buttons); single source of truth = `?song=<songId>` URL param; every render derives currentIndex + displayed data + labels from the ordered song array; nav buttons only update the URL; prefetch neighbor chord data + in-memory session cache; disable at first/last.
4. (User follow-up) Extract the prev/next bar into a SEPARATE file/component so LyricsViewer can reuse it.

## Exploration findings (verified)

- `components/setlists/setlist-detail/ChordsViewer.tsx` — modal used by `SetlistSections.tsx` (line 501) and `SetlistPreviewCard.tsx` (line 661). Renders ALL songs of one sectionType; per-song textarea `key={s.id}`; local drafts `chordEdits`; per-keystroke queued save `handleChordsChange` → `saveChordField` → `fetch PATCH /api/songs/:song_id`; `focusedFieldRef`+`focusedInput` exist but no edit-session state; `onFocus` does `scrollIntoView(center)` after 300ms; live previews via `useSongCollaboration` (broadcast channels `song:<id>`); `onSectionsChange` reconciles saved values upward; close flushes dirty drafts.
- `components/setlists/setlist-detail/LyricsViewer.tsx` — accordion (tap-to-expand) list of section songs, no URL param, same modal scaffold; `setlist` prop NOT passed (only sections) — will need it (or the ordered array) for nav.
- `components/songs/SongCard.tsx` — per-song chords editor (local `chordsDraft`, `editingChords`); `saveChords` (line 139) calls `router.refresh()` (line 157) — per requirement 2 this must go in favor of patching local state.
- `lib/hooks/use-realtime-setlist.ts` — `useRealtimeSections(setlistId)` (postgres_changes on `setlist_sections`, immediate `invalidateQueries` on `["setlists", id, "sections"]` + `["setlists"]` for ANY event) and `useRealtimeSongs()` (postgres_changes on `songs`, immediate invalidate `["songs"]`). These are the "apply immediately" seams to convert to 20s trailing-edge buffered in-place patches.
- `lib/hooks/use-songs.ts` `useUpdateSong` / `use-setlists.ts` `useUpdateSetlist` — optimistic + `invalidateQueries` + `router.refresh()` onSettled (used by song/setlist edit FORMS, not the per-keystroke chord path; the chord PATCH goes through raw fetch in both viewers).
- `app/api/songs/[id]/route.ts` PATCH — writes then `revalidatePath("/setlists", "/setlists/[id]", "/songs")` + `revalidateTag("songs","setlists")` (fine; tag revalidation alone does not reload an open page; keep).
- Server pages: `app/(main)/setlists/[id]/page.tsx` (unstable_cache, tags `["setlists"]`, revalidate 30) → `SetlistDetail` → `SetlistContent` (`useState(initialSections)`, `useEffect([initialSetlist, initialSections])` REPLACES state wholesale — the "replace the array" seam) → `SetlistSections`. `app/(main)/songs/page.tsx`: server-fed `songs` prop (unstable_cache, `revalidate = 60`) → `SongsGroupedView` (uses `useRealtimeSongs()` line 96; already uses `useSearchParams` line 89 for `?category=`).
- Types in `lib/type.ts`: `Setlist`, `SetlistSectionWithSong` (has `songs.chords`), `SetlistViewerState{kind,sectionType}`, `SongListitem`.
- Tests: NO test infra (package.json scripts: dev/build/start/lint only). Test strategy: none; QA = `npm run lint` + `npm run build` + agent-executed runtime verification per todo.

## Topology (components ledger)

| id | component | one-line outcome | status |
|----|-----------|------------------|--------|
| C1 | Realtime hooks + editing registry | UPDATE events buffered 20s trailing-edge, skipped while local user edits, applied as in-place cache patches; INSERT/DELETE unchanged | pending |
| C2 | ChordsViewer edit-session stability | isEditing/editingChordId guards scroll/focus/remount; refetch reconciled in place | pending |
| C3 | Shared nav (hook + SongNavBar component in separate file) | ?song= URL param single source of truth; derive-only; prefetch + in-memory cache; boundary disable | pending |
| C4 | ChordsViewer single-song display + nav | sticky bottom bar, Song X of Y, prev/next only touch the URL | pending |
| C5 | LyricsViewer single-song display + nav | reuses the same hook + SongNavBar | pending |
| C6 | SongCard save path | router.refresh() removed; local state patched; registry wired | pending |

## Decisions adopted (defaults — user may veto in approval reply)

1. **Single-song-at-a-time display in BOTH viewers** — requirement 3 derives "the displayed chord data" from `songList[currentIndex]` and prefetches neighbors, which only makes sense for a one-song view; user's follow-up extends the nav to lyrics, so LyricsViewer becomes single-song too (its tap-to-expand accordion is replaced).
2. **Nav scope = whole setlist** — ordered array = all sections flattened by (`section_order` — `setlist.section_order ?? DEFAULT_SECTION_ORDER ["worship","praise","altar_call","tithes_offering","special"]` — then `sort_order`). Matches "the setlist's ordered song array" / "Song X of Y" / "last song in the setlist".
3. **Chords displayed from the already-loaded `sections` prop** (all songs incl. chords are in memory) — no per-song fetch for the visible content; the neighbor prefetch + module-level Map cache (GET `/api/songs/:id`) is still implemented per requirement to warm/cache neighbor data (used as fallback display source if a section's song entry lacks chords).
4. **Default song on open**: fallback logic — if `?song=` matches a song in the ordered array use it, else first song of the opened `sectionType`.
5. **Editing registry** `lib/realtime-editing.ts`: module-scope `setRealtimeEditing(scope, active)` / `isRealtimeEditing(scope)` with scopes `"songs"` | `"setlist_sections"`, plus `lastLocalWriteTs` per scope; realtime hooks check it before applying buffered payloads and drop payloads whose `commit_timestamp` ≤ last local write.
6. **Buffer only UPDATE events** (20s trailing-edge); INSERT/DELETE keep immediate invalidate (structural changes, not per-keystroke).
7. **No `router.refresh()`** in chord-save paths: remove from `SongCard.saveChords`; ChordsViewer already avoids it.
8. **Test strategy: none** (repo has no test runner) — every todo carries agent-executed QA (lint/build/runtime) with evidence path.

## Approval gate

Approach: (W1) small libs — `lib/realtime-editing.ts`, rewrite of `lib/hooks/use-realtime-setlist.ts` (20s buffer + in-place patch + editing skip); (W2) ChordsViewer edit-session stability + in-place reconciliation + SongCard router.refresh removal; (W3) shared nav — `lib/hooks/use-song-navigation.ts` + `components/setlists/setlist-detail/SongNavBar.tsx` (separate file), single-song ChordsViewer with `?song=` URL, single-song LyricsViewer; (W4) verification + commits.

Next action after approval: create `.omo/plans/chord-viewer-stability-navigation.md` (scaffold), run Mandatory Metis gap analysis, APPEND todos, fill TL;DR last.