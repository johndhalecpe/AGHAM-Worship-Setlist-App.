import { supabase } from "@/lib/supabase";
import { Song } from "@/lib/type";

export async function getAllSongs(searchQuery?: string): Promise<Song[]> {
  let supabaseQuery = supabase
    .from("songs")
    .select("*")
    .order("title", { ascending: true });

  if (searchQuery) {
    supabaseQuery = supabaseQuery.or(
      `title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,lyrics.ilike.%${searchQuery}%`
    );
  }

  const { data, error } = await supabaseQuery;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSongById(id: string): Promise<Song | null> {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createSong(data: {
  title: string;
  author?: string;
  category?: string;
  language?: string;
  default_key?: string | null;
  default_bpm?: number | null;
  default_time_signature?: string | null;
  lyrics?: string | null;
  chords?: string | null;
}): Promise<Song> {
  const hasDetails = !!(data.default_key && data.default_bpm && data.default_time_signature && data.lyrics);
  const status = hasDetails ? "published" : "draft";

  const { data: song, error } = await supabase
    .from("songs")
    .insert({
      title: data.title,
      author: data.author ?? null,
      category: data.category ?? null,
      language: data.language ?? null,
      default_key: data.default_key ?? null,
      default_bpm: data.default_bpm ?? null,
      default_time_signature: data.default_time_signature ?? null,
      lyrics: data.lyrics ?? null,
      chords: data.chords ?? null,
      status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return song;
}

export async function updateSong(
  id: string,
  data: Record<string, unknown>,
): Promise<Song> {
  const updateFields: Record<string, unknown> = {};
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.author !== undefined) updateFields.author = data.author;
  if (data.category !== undefined) updateFields.category = data.category;
  if (data.language !== undefined) updateFields.language = data.language;
  if (data.default_key !== undefined) updateFields.default_key = data.default_key;
  if (data.default_bpm !== undefined) updateFields.default_bpm = data.default_bpm;
  if (data.default_time_signature !== undefined) updateFields.default_time_signature = data.default_time_signature;
  if (data.lyrics !== undefined) updateFields.lyrics = data.lyrics;
  if (data.chords !== undefined) updateFields.chords = data.chords;

  const hasAllDetails = !!(data.default_key && data.default_bpm && data.default_time_signature && data.lyrics);
  if (data.status !== undefined) {
    updateFields.status = data.status;
  } else if (hasAllDetails) {
    updateFields.status = "published";
  }

  const { data: song, error } = await supabase
    .from("songs")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return song;
}

export async function deleteSong(id: string): Promise<void> {
  const { error } = await supabase.from("songs").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
