export type Song = {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  language: string | null;
  created_at: string;
};

export type Setlist = {
  id: string;
  date: string;
  title: string | null;
  description: string | null;
  song_leader: string | null;
  created_at: string;
};

export type SetlistSection = {
  id: string;
  setlist_id: string;
  song_id: string;
  section_type: string;
  sort_order: number;
  created_at: string;
};

export type SetlistSectionWithSong = {
  id: string;
  setlist_id: string;
  song_id: string;
  section_type: string;
  sort_order: number;
  created_at: string;
  songs: {
    id: string;
    title: string;
    author: string | null;
    category: string | null;
    language: string | null;
  };
};
