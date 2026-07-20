---
name: data-freshness
description: Enforces the mutate -> invalidate -> reflect pattern for every Supabase write in the AGHAM Worship Setlist App, so the UI updates instantly after a create/update/delete without a manual page refresh. Use this skill whenever writing or reviewing a Server Action, form submission, or any code path that creates, updates, or deletes rows in Songs, Setlists, Setlist Sections, or Chord data. Also use it when debugging stale UI after a save (edited data not appearing until the page is refreshed) -- this is the same bug class as the ChordsViewer stale-state issue, and this skill exists specifically to stop it from recurring elsewhere in the app.
---

# Data Freshness: Mutate -> Invalidate -> Reflect

## Why this exists

Next.js caches rendered route data by default. A Supabase write does not
automatically tell Next.js which cached routes or components are now stale.
Skip the invalidation step and edited data sits stale on screen until a
manual refresh -- this is the root cause of the stale-state bug already
found in `ChordsViewer.tsx`. Treat that bug as the canonical example while
auditing any other component that writes data.

## The rule

Every write path must do three things, in this order:

1. **Mutate** -- perform the Supabase write.
2. **Invalidate** -- tell Next.js which cached data is now stale.
3. **Reflect** -- the UI updates without the user refreshing.

Never skip step 2. A cache with no invalidation is worse than no cache at
all -- it hides the staleness instead of preventing it.

## Step 1: Audit the write path

For every Supabase write in scope (Songs, Setlists, Setlist Sections, Chords),
identify:

- Does it happen in a **Server Action**? Prefer this.
- Or is it a **client-only write** (supabase-js called directly from the
  browser)? Flag these separately -- they need the optimistic-update
  pattern in Step 3, not `revalidateTag`/`revalidatePath`.

## Step 2: Server Actions -- revalidate after every successful write

Prefer `revalidateTag()` if fetches are already tagged; fall back to
`revalidatePath()` otherwise. Never assume one route covers it -- a Song
can appear inside any Setlist that references it.

```ts
'use server'

export async function updateSong(id: string, data: SongInput) {
  const supabase = createServerClient(/* ... */)
  const { error } = await supabase.from('songs').update(data).eq('id', id)
  if (error) throw error

  // Invalidate every place this song's data can appear
  revalidateTag('songs')
  revalidateTag(`song:${id}`)
  revalidatePath('/songs')
  revalidateTag('setlists') // songs render inside setlists too
}
```

**Affected-routes reference (extend as new views are added):**

| Mutation                      | Must invalidate                                   |
|--------------------------------|----------------------------------------------------|
| Edit/delete a Song              | `/songs`, `/songs/[id]`, every `/setlists/[id]` containing it |
| Edit/delete a Setlist           | `/setlists`, `/setlists/[id]`                      |
| Reorder Setlist Sections        | `/setlists/[id]`                                   |
| Edit a Chord chart               | wherever `ChordsViewer` reads from (song detail, setlist view) |

## Step 3: Client-only writes -- optimistic update + reconcile

If a write can't go through a Server Action, update local state immediately,
then reconcile with the server:

```tsx
const handleSave = async (newValue: SongInput) => {
  const previous = localState
  setLocalState(newValue)              // reflect immediately

  const { error } = await saveToSupabase(newValue)
  if (error) {
    setLocalState(previous)            // roll back
    showToast('Save failed')
  } else {
    router.refresh()                   // reconcile with source of truth
  }
}
```

## Step 4: Guardrail -- no new cache layer without matching invalidation

Before adding SWR, React Query, or `unstable_cache` anywhere in this app,
answer: *does every mutation touching this data also call the matching
invalidate/mutate function?*

If the answer isn't a clear yes, don't add the cache layer yet -- it will
create a new instance of the ChordsViewer bug somewhere else in the app.

## Checklist -- run before merging any feature that touches Songs, Setlists, Setlist Sections, or Chords

- [ ] Write happens in a Server Action (or is explicitly flagged as client-only)
- [ ] `revalidateTag`/`revalidatePath` is called immediately after a successful write
- [ ] Every route/component displaying this data is covered, not just the obvious one
- [ ] Client-only writes have an optimistic update with rollback on error
- [ ] Any new cache layer has a corresponding invalidation call for every write path that touches it
