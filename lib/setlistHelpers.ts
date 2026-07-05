import { SetlistSectionWithSong } from "@/lib/type";

export function getEffectiveSongKey(s: SetlistSectionWithSong): string {
  return s.song_key ?? s.songs.default_key ?? "G";
}
