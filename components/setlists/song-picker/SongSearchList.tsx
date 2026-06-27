"use client";

import { Song } from "@/lib/type";

type SongSearchListProps = {
  songs: Song[];
  loading: boolean;
  onSelect: (songId: string) => void;
};

export default function SongSearchList({ songs, loading, onSelect }: SongSearchListProps) {
  return (
    <div
      className="rounded-lg mt-2 overflow-hidden"
      style={{
        border: "1px solid var(--color-border)",
      }}
    >
      {songs.map((song) => (
        <div
          key={song.id}
          className="flex items-center gap-2 px-3 py-2 text-sm border-b last:border-b-0 transition-colors"
          style={{
            borderColor: "var(--color-border)",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor =
              "var(--color-surface-elevated)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor =
              "transparent")
          }
        >
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onSelect(song.id)}
          >
            <span className="font-medium">{song.title}</span>
            {song.author && (
              <span
                className="ml-2"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {song.author}
              </span>
            )}
          </div>
          <button
            onClick={() => onSelect(song.id)}
            disabled={loading}
            className="shrink-0 p-1 rounded transition-colors hover:opacity-80 active:scale-95"
            style={{ color: "#D84F0B" }}
            aria-label={`Add ${song.title}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
