# BPM and Time Signature Feature (Removed)

This document describes how the BPM (Beats Per Minute) and Time Signature features were implemented in the AGHAM Worship Setlist App, in case they need to be brought back in the future.

## Overview

The BPM and Time Signature features allowed users to:
- Set a default BPM for each song (40-300 BPM range)
- Set a default time signature for each song (4/4, 3/4, 6/8)
- Display these values in the song library and when editing songs

## Database Schema

The `songs` table had two additional columns:
- `default_bpm` (integer, nullable): Stores the BPM value (40-300)
- `default_time_signature` (string, nullable): Stores the time signature ("4/4", "3/4", "6/8", or empty string)

## Files Involved

### Type Definitions
- `lib/type.ts`: Added `default_bpm` and `default_time_signature` to the `Song` type

### UI Components
1. **`components/songs/MusicalDataSection.tsx`** (entire file was the BPM/time signature UI)
   - Key selector (already exists, keep this)
   - BPM input with increment/decrement buttons
   - Time signature selector (4/4, 3/4, 6/8 buttons)

2. **`components/songs/SongEditForm.tsx`**
   - Added `defaultBpm` and `defaultTimeSignature` state
   - Added `onBpmChange` and `onTimeSignatureChange` props to `MusicalDataSection`
   - Included BPM/time signature in the `onSave` callback

3. **`components/songs/SongCard.tsx`**
   - Displayed BPM and time signature if present

### Forms and Pages
4. **`app/(main)/songs/_components/SongsGroupedView.tsx`**
   - Included `default_bpm` and `default_time_signature` in the `handleSave` function

5. **`app/(main)/songs/new/page.tsx`** or **`app/(main)/songs/_components/NewSongForm.tsx`**
   - Included BPM/time signature in new song creation

6. **`components/setlists/setlist-detail/SetlistSections.tsx`**
   - Included `default_bpm` and `default_time_signature` in `handleEditSongSave`

### API Routes
7. **`app/api/songs/[id]/route.ts`** (PATCH handler)
   - Accepted `default_bpm` and `default_time_signature` in the request body
   - Updated the database accordingly

8. **`app/api/songs/route.ts`** (POST handler)
   - Accepted `default_bpm` and `default_time_signature` for new songs

## How to Re-enable This Feature

### Step 1: Database Migration
Run a SQL migration to add the columns back (if they were dropped):

```sql
ALTER TABLE songs ADD COLUMN IF NOT EXISTS default_bpm integer;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS default_time_signature text;
```

### Step 2: Update Type Definitions
In `lib/type.ts`, add back to the `Song` type:
```typescript
export type Song = {
  // ... existing fields ...
  default_bpm: number | null;
  default_time_signature: string | null;
  // ... existing fields ...
};
```

### Step 3: Restore MusicalDataSection Component
Restore the `components/songs/MusicalDataSection.tsx` file with:
- BPM input (40-300 range, increment/decrement buttons)
- Time signature selector (4/4, 3/4, 6/8 buttons)
- Keep the Key selector (already present)

### Step 4: Update SongEditForm
In `components/songs/SongEditForm.tsx`:
- Add `defaultBpm` and `defaultTimeSignature` state
- Add `onBpmChange` and `onTimeSignatureChange` props to `MusicalDataSection`
- Include in `onSave` callback

### Step 5: Update SongCard
In `components/songs/SongCard.tsx`:
- Display BPM and time signature if present

### Step 6: Update SongsGroupedView
In `app/(main)/songs/_components/SongsGroupedView.tsx`:
- Include `default_bpm` and `default_time_signature` in `handleSave`

### Step 7: Update NewSongForm
In the new song form:
- Include BPM/time signature fields

### Step 8: Update SetlistSections
In `components/setlists/setlist-detail/SetlistSections.tsx`:
- Include `default_bpm` and `default_time_signature` in `handleEditSongSave`

### Step 9: Update API Routes
In `app/api/songs/[id]/route.ts` and `app/api/songs/route.ts`:
- Accept and process `default_bpm` and `default_time_signature`

## UI Design Notes

### BPM Input
- Range: 40-300 BPM
- Default: 120 BPM (if not specified)
- Increment/decrement by 1
- Input field for direct entry

### Time Signature
- Options: 4/4, 3/4, 6/8
- Toggle behavior: click to select, click again to deselect
- No default (empty string if not specified)

## Data Flow

1. User opens song edit form → loads current BPM/time signature from database
2. User modifies BPM/time signature → updates local state
3. User saves → sends updated values to API
4. API updates database → returns updated song
5. UI updates to reflect new values

## Notes

- BPM and Time Signature are optional fields (nullable)
- They are only displayed in the song library and edit forms
- They are not used in setlist views or chord/lyrics viewers
- The Key selector was kept as it's essential for musicians