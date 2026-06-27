export type Song = {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  language: string | null;
  default_key: string;
  default_bpm: number;
  default_time_signature: string;
  lyrics: string;
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

export type SetlistSection = {
  id: string;
  setlist_id: string;
  song_id: string;
  section_type: string;
  sort_order: number;
  notes: string | null;
  created_at: string;
};

export type SetlistSectionWithSong = {
  id: string;
  setlist_id: string;
  song_id: string;
  section_type: string;
  sort_order: number;
  notes: string | null;
  created_at: string;
  songs: {
    id: string;
    title: string;
    author: string | null;
    category: string | null;
    language: string | null;
    default_key: string;
    default_bpm: number;
    default_time_signature: string;
    lyrics: string;
  };
};

export type SetlistWithSections = Setlist & {
  sections: SetlistSectionWithSong[];
};
