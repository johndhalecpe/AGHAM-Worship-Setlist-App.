import { supabase } from "@/lib/supabase";
import { SetlistSectionWithSong } from "@/lib/type";

export async function getSectionsBySetlistId(id: string): Promise<SetlistSectionWithSong[]> {
  const { data, error } = await supabase
    .from("setlist_sections")
    .select(
      `
      *,
      songs (
        id,
        title,
        author,
        category,
        default_key,
        default_bpm,
        default_time_signature,
        lyrics,
        chords,
        status
      )
    `,
    )
    .eq("setlist_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as SetlistSectionWithSong[];
}

export async function getSectionsBySetlistIdForPage(id: string): Promise<SetlistSectionWithSong[]> {
  const { data, error } = await supabase
    .from("setlist_sections")
    .select(
      `
      *,
      songs (
        id,
        title,
        author,
        category,
        language,
        default_key,
        default_bpm,
        default_time_signature,
        lyrics,
        chords,
        status
      )
    `
    )
    .eq("setlist_id", id)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data as unknown as SetlistSectionWithSong[];
}

export async function createSection(data: {
  setlist_id: string;
  song_id: string;
  section_type: string;
}): Promise<SetlistSectionWithSong> {
  const { data: existingSectionsCount, error: countError } = await supabase
    .from("setlist_sections")
    .select("id")
    .eq("setlist_id", data.setlist_id)
    .eq("section_type", data.section_type);

  if (countError) {
    throw new Error(countError.message);
  }

  const { data: section, error } = await supabase
    .from("setlist_sections")
    .insert({
      setlist_id: data.setlist_id,
      song_id: data.song_id,
      section_type: data.section_type,
      sort_order: existingSectionsCount.length,
    })
    .select(
      `
      *,
      songs (
        id,
        title,
        author,
        category,
        default_key,
        default_bpm,
        default_time_signature,
        lyrics,
        chords,
        status
      )
    `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return section as unknown as SetlistSectionWithSong;
}

export async function deleteSection(sectionId: string, setlistId: string): Promise<void> {
  const { error } = await supabase
    .from("setlist_sections")
    .delete()
    .eq("id", sectionId)
    .eq("setlist_id", setlistId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSections(
  setlistId: string,
  items: Array<{
    id: string;
    sort_order?: number;
    notes?: string | null;
    song_key?: string | null;
    override_lyrics?: string | null;
    chord_notes?: Record<string, string> | null;
  }>,
): Promise<void> {
  if (!items || !Array.isArray(items)) {
    throw new Error("Invalid request: items must be an array");
  }

  for (const sectionUpdate of items) {
    const updatePayload: Record<string, unknown> = {};
    if (sectionUpdate.sort_order !== undefined) updatePayload.sort_order = sectionUpdate.sort_order;
    if ("notes" in sectionUpdate && sectionUpdate.notes !== undefined) updatePayload.notes = sectionUpdate.notes;
    if ("song_key" in sectionUpdate && sectionUpdate.song_key !== undefined) updatePayload.song_key = sectionUpdate.song_key;
    if ("override_lyrics" in sectionUpdate && sectionUpdate.override_lyrics !== undefined) updatePayload.override_lyrics = sectionUpdate.override_lyrics;
    if ("chord_notes" in sectionUpdate && sectionUpdate.chord_notes !== undefined) updatePayload.chord_notes = sectionUpdate.chord_notes;

    if (Object.keys(updatePayload).length === 0) continue;

    const { error } = await supabase
      .from("setlist_sections")
      .update(updatePayload)
      .eq("id", sectionUpdate.id)
      .eq("setlist_id", setlistId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
