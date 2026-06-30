export type Song = {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  language: string | null;
  default_key: string | null;
  default_bpm: number | null;
  default_time_signature: string | null;
  lyrics: string | null;
  chords: string | null;
  status: string;
  created_at: string;
};

export type Setlist = {
  id: string;
  date: string;
  title: string | null;
  description: string | null;
  song_leader: string | null;
  branch: string;
  created_at: string;
};

export type SetlistSectionWithSong = {
  id: string;
  setlist_id: string;
  song_id: string;
  section_type: string;
  sort_order: number;
  notes: string | null;
  song_key: string | null;
  override_lyrics: string | null;
  chord_notes: Record<string, string> | null;
  created_at: string;
  songs: {
    id: string;
    title: string;
    author: string | null;
    category: string | null;
    language: string | null;
    default_key: string | null;
    default_bpm: number | null;
    default_time_signature: string | null;
    lyrics: string | null;
    chords: string | null;
    status: string;
  };
};

export type SetlistWithSections = Setlist & {
  sections: SetlistSectionWithSong[];
};
