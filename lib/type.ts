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

export type SongListItem = Omit<Song, "lyrics" | "chords">;

export type Setlist = {
  id: string;
  date: string;
  title: string | null;
  description: string | null;
  song_leader: string | null;
  branch: string;
  spotify_playlist_id: string | null;
  spotify_playlist_url: string | null;
  section_order: string[] | null;
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

export type Profile = {
  id: string;
  name: string;
  role: "singer" | "musician" | "staff" | "admin";
  status: "pending" | "approved" | "rejected";
  palette: string | null;
  created_at: string;
  updated_at: string;
};

export type PasswordReset = {
  id: string;
  email: string;
  requested_password: string | null;
  created_at: string;
  resolved: boolean;
};

export const ADMIN_EMAIL = "johndhalecpe@setlist.com";
