## [2026-08-11] T7/T8 correction: scroll-based nav (user request)
- User clarified: viewers must KEEP the full scrollable song list; Next/Previous only scrolls to the adjacent song block — NOT a single-card swap.
- ChordsViewer: restored `filtered.map` full render with `songRefs` (keyed by section id); scroll effect on `[currentIndex, currentSectionId, editingChordId]` (skips while editing — T3 guard); SongNavBar stays sticky at bottom.
- LyricsViewer: restored tap-to-expand accordion list with `songRefs`; scroll effect on `[currentIndex, currentSectionId]`; SongNavBar at bottom.
- Type contract fix: `useSongNavigation` now takes `NavSong[]` = `Pick<Song, "id" | "title">` (nested `songs` objects lack `created_at`, so `SongListItem[]` was unassignable — build failed). SongNavBar props use `NavSong`.
- Suspense: both viewer call sites (SetlistSections.tsx, SetlistPreviewCard.tsx) wrapped in `<Suspense fallback={null}>` (useSearchParams requirement, mirrors songs/page.tsx).
- Commits: be7412d (T7), 5b6d92a (T8), faa7807 (scroll fix).
- Delegation broken in this environment: all 4 Final-Wave subagents timed out with no output; verification done directly (lint scoped + build + grep).

## [2026-08-11] LyricsViewer opened-song fix (user-reported broken)
- Problem: expandedSongId started null (nothing open by default); nav (Next/Prev) changed URL/currentIndex but NOT the expanded lyrics; tapping a title didn't move the nav position.
- Fix: REMOVED expandedSongId state entirely. The expanded song is now DERIVED from the URL-driven currentSongId (single source of truth = ?song= param). Title tap calls goTo(songId) (new hook fn) so nav follows the opened song. Default = first song (hook defaults to orderedSongs[0].id).
- Lint gotcha: react-hooks/set-state-in-effect fires on setState-in-effect sync patterns — derive instead of sync. This is why the earlier effect-based approach was rejected.
- goTo(songId) added to use-song-navigation.ts (additive; ChordsViewer unaffected). Guards: only navigates if songId exists in orderedSongs.
- Verified: eslint clean on both files, npm run build passes, dev server 200 on setlist detail.

## [2026-08-11] Scroll-driven nav sync (both viewers) + lyrics expand fix
- User req: chords display must update when user MANUALLY scrolls (nav bar + URL follow scroll position); lyrics viewer same + fix "collapsed cards can't expand".
- ROOT CAUSE of lyrics bug: goTo(s.id) passed SECTION id; useSongNavigation guard matches SONG ids (orderedSongs = s.songs) -> rejected -> URL never changed -> nothing expanded. (Section id vs song id confusion — s.id vs s.songs.id.)
- New unified model (ChordsViewer + LyricsViewer):
  - Scroll listener on modal panel (rAF-throttled, passive): first block whose getBoundingClientRect().bottom > containerTop = current; if its song id != currentSongId -> goTo(songId). URL is ALWAYS scroll-driven now.
  - Nav buttons (Prev/Next) + title taps ONLY scroll imperatively (scrollIntoView smooth on songRefs[sectionId]); listener updates URL as block reaches top. Avoids race where URL set before scroll lands (old song still covering top would flip it back).
  - Removed old currentIndex-keyed scroll effect (it fought manual scroll: after listener->goTo, effect yank-scrolled to current block).
  - Mount-position effect scrolls to initial section once (deep-link support); uses [initialSectionId] captured via useState(initial) not useRef(x).current (react-hooks/refs bans ref read during render — 2 NEW errors this round, fixed).
  - Lyrics expanded song still derived: currentSongId === s.songs.id (aria-expanded/chevron/lyrics render).
- Chords draft flush kept in handleGoPrevious/Next (flushes CURRENT section draft at click time = section being left).
- Lint: only 2 pre-existing T3 errors remain (chordEditsRef.current 108:3, handleCloseRef.current 300:3). Build passes. Dev 200.

## [2026-08-11] LyricsViewer: click-driven accordion (scroll no longer expands/moves nav)
- User refinement: lyrics viewer must NOT auto-open collapsed cards on scroll; ONLY clicking a card (or Next/Prev) updates the system's memory of the opened song.
- ChordsViewer KEEPS scroll-driven nav (user explicitly wanted scroll-follow there; chords have no expand/collapse so no layout-jump problem).
- LyricsViewer: removed the scroll-sync listener entirely (was: first block with bottom > containerTop -> goTo). Now:
  - handleSongClick(s): scrollToSong(s.id) + goTo(s.songs.id) -> expands + updates memory (URL) in one explicit action.
  - handlePrevious/handleNext: scrollToSong(prev/nextSection.id) + goTo(songs.id) -> expand target, collapse previous, memory follows.
  - Scrolling does NOTHING to state — cards stay as-is, nav bar keeps showing the remembered (clicked) song.
  - Expanded still derived from currentSongId (URL = system memory), default = first song, mount-position effect kept for deep links.
- Lesson: don't reuse the chords scroll-sync pattern in the lyrics viewer — accordion + scrollspy conflict (auto-expand while scrolling = constant layout shift). Two different nav models in one codebase: scroll-driven (chords) vs click-driven memory (lyrics).
- Verified: eslint clean on LyricsViewer (only the 2 pre-existing T3 errors remain in ChordsViewer), build passes.
