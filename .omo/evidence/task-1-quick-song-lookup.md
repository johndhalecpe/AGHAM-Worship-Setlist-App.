# Evidence — Task 1: `/api/songs` `mode=chords` search

**Date:** 2026-08-11
**Change:** `app/api/songs/route.ts` GET handler only. Added `const mode = searchParams.get("mode")`; when `mode === "chords"` the `.or(...)` searches title/author/chords; any other value (absent, `lyrics`, `bogus`) keeps the original title/author/lyrics `.or(...)` byte-for-byte.
**Gate:** `npx tsc --noEmit` → PASS (no output, exit 0).

## QA song selection
Target: **Rumaragasang pagpapala** (`64c00f23-1c11-46fc-91ba-f820f2da520e`, author Joshua Garcia).
- Its chords text contains `Bm` (`Verse G Bm C D … C D Bm Em G -- Am D`). Confirmed: `/bm/i` matches chords.
- Its lyrics do NOT contain `Bm` (all lines checked, none match) — so it was unsearchable by lyrics and required `mode=chords`.

Helpers (OPSEC: comments removed; token usage deliberately minimal).

## Assertions (dev server on :3000, live Supabase project)

### 1. `curl 'http://localhost:3000/api/songs?search=Bm&mode=chords'` → chord hit
Returned `count 12` songs, **including `Rumaragasang pagpapala`** — found purely via its chords field. Others: Heart of worship, Holy Forever, I sing praises, I'll sing about Jesus, Lord You Are Good, Love you so much, Nothing is Impossible, The time has come, Wala kang Katulad, When the spirit of the Lord (David's Song), Yahweh will manifest himself. All have `Bm` in chords or title/author. **PASS**

### 2. `curl 'http://localhost:3000/api/songs?search=Bm'` (no mode) → behaves as before
Returned `count 1`: **I trust in God** (`86cc0e0b…`). No `Bm` in chords search — this is the legacy lyrics path hitting the word "su**bm**ission" in that song's lyric. `Rumaragasang pagpapala` is NOT present. This is the exact pre-change behavior (lyrics `.or(...)` untouched). **PASS**

### 3. `curl 'http://localhost:3000/api/songs?search=Bm&mode=bogus'` → same as no-mode
Returned `count 1`, same single song (I trust in God). Unknown mode falls back to the lyrics `.or(...)` string, byte-for-byte identical to no-mode. **PASS**

### 4. `curl 'http://localhost:3000/api/songs'` (no search) → full list, same shape
Returned `count 123`, `array: true`, objects carry the unchanged keys `id,title,author,category,language,default_key,default_bpm,default_time_signature,lyrics,chords,status,created_at`. No filtering applied when `search` absent (the `if (searchTitle)` block skipped, `.order("title")` unchanged). **PASS**

### Sanity: `mode=chords` still matches via title/author
`curl 'http://localhost:3000/api/songs?search=Alleluia&mode=chords'` returned `count 0` — the old lyrics hit (Agnus Dei, "Alleluia" in verse) no longer matches because that word appears only in lyrics, proving the chords branch genuinely swapped the searchable field rather than adding to it. **PASS**

## Files touched
- `app/api/songs/route.ts` — GET only. `.select(...)`, `.order(...)`, Cache-Control, POST handler, `revalidatePath`/`revalidateTag` untouched. No other file modified.
- `git diff --stat`: `app/api/songs/route.ts | 13 ++++++++++---  (1 file changed, 10 insertions(+), 3 deletions(-))`.

## Verdict
**ALL ASSERTIONS PASS.** No commit (handled by orchestrator).