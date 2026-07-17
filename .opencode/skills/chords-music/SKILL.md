---
name: chords-music
description: Music data structures, key system, chord_notes JSONB, and rendering patterns for the worship setlist app
---

## Song-level fields (`songs` table)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `default_key` | TEXT | `'G'` | Major/minor key string like `"C"`, `"D#m"`, `"Bb"` |
| `default_bpm` | INTEGER | `120` | Beats per minute, range 40-300 |
| `default_time_signature` | TEXT | `'4/4'` | One of: `"4/4"`, `"3/4"`, `"6/8"` |
| `chords` | TEXT | `NULL` | Plain-text chord chart (monospace formatted) |
| `lyrics` | TEXT | `NULL` | Song lyrics text |

## Section-level fields (`setlist_sections` table)

| Column | Type | Notes |
|--------|------|-------|
| `song_key` | TEXT | Per-instance key override; overrides `songs.default_key` |
| `notes` | TEXT | Plain-text section metadata note (italic quoted display) |
| `chord_notes` | JSONB | JSON object with 4 named fields (see below) |

## Key fallback chain (used everywhere)

```
s.song_key ?? s.songs.default_key ?? "G"
```

Always use this exact chain when displaying a song's key.

## Valid keys (34 total)

The `KeyPicker` component defines exactly these valid keys:

- **Major:** `C`, `C#`, `Db`, `D`, `D#`, `Eb`, `E`, `F`, `F#`, `Gb`, `G`, `G#`, `Ab`, `A`, `A#`, `Bb`, `B`
- **Minor:** `Cm`, `C#m`, `Dbm`, `Dm`, `D#m`, `Ebm`, `Em`, `Fm`, `F#m`, `Gbm`, `Gm`, `G#m`, `Abm`, `Am`, `A#m`, `Bbm`, `Bm`

Enharmonic equivalents are both supported (e.g. `C#` and `Db` are separate valid keys).

Constraint notes:
- `B` and `E` cannot be sharp (buttons disabled in KeyPicker)
- `C` and `F` cannot be flat

Parsing pattern: `letter + accidental (#/b) + minor (m)`. E.g. `"C#m"` → `{ letter: "C", accidental: "sharp", isMinor: true }`.

## `chord_notes` JSONB structure

4 named string fields:

| Key | Purpose | Where rendered |
|-----|---------|---------------|
| `intro` | Chord diagram/text before the first song | Top of section in ChordsViewer |
| `outro` | Chord diagram/text after each song | Below each song's chords |
| `transition` | Chord diagram/text between consecutive songs | Between songs (only if more songs follow) |
| `drummer_notes` | Drummer-specific instructions | In Drummer mode toggle view |

Stored on `setlist_sections` as JSONB. `NULL` means no notes. Empty `{}` is not used (converted to null).

## Saving pattern

When saving chord_notes via PATCH `/api/setlists/:id/sections`:
- Set `merge_chord_notes: true` in each item
- The API reads existing JSONB, merges incoming keys, drops empty-string keys, preserves unmentioned keys
- Send ALL 4 keys in the payload for each song being updated; send empty `""` for cleared fields
- Use `chord_notes: null` when a song has zero notes in all 4 fields

## Chords text editing

The `chords` field on `songs` is plain monospace text. Editing flows:
- **Inline (SongCard):** PATCH `/api/songs/:id` with `{ chords }`
- **Setlist overlay (ChordsViewer):** PATCH `/api/songs/:song_id` per-song when changed, tracked via separate `chordEdits` state keyed `"${sectionId}-chords"`

Always use monospace font family `'Courier New', Courier, monospace` for chords display and editing.

## Auto-publish logic

A song auto-publishes (status `"published"`) when ALL of these are non-null:
- `default_key`
- `default_bpm`
- `default_time_signature`
- `lyrics`

Otherwise status stays `"draft"`.

## BPM

- Stored as integer on `songs.default_bpm`, default `120`
- Range: 40-300 (enforced in MusicalDataSection)
- Display format: `bpm: {value}`

## Time signature

- Stored as text on `songs.default_time_signature`, default `'4/4'`
- Valid options: `"4/4"`, `"3/4"`, `"6/8"`
- Display format: `time: {value}`

## No transposition logic exists

The app does NOT have any algorithmic key transposition. Chords are stored and displayed as plain text only.
