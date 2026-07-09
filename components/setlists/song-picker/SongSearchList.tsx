"use client";

import { memo } from "react";
import { Song } from "@/lib/type";

type SearchMatches = {
  title: Song[];
  author: Song[];
  lyrics: Song[];
};

type SongSearchListProps = {
  searchMatches: SearchMatches;
  loading: boolean;
  onSelect: (songId: string) => void;
};

const GROUP_LABELS: Record<keyof SearchMatches, string> = {
  title: "Found a song match",
  author: "Found an author match",
  lyrics: "Found a lyrics match",
};

function SongSearchListFn({ searchMatches, loading, onSelect }: SongSearchListProps) {
  const groups = (
    Object.entries(GROUP_LABELS) as [keyof SearchMatches, string][]
  ).filter(([key]) => searchMatches[key].length > 0);

  return (
    <div className="mt-2 flex flex-col gap-3">
      {groups.map(([key, label]) => (
        <div key={key}>
          <h4
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {label}
          </h4>
          <div
            className="rounded-lg overflow-hidden"
            style={{
              border: "1px solid var(--color-border)",
            }}
          >
            {searchMatches[key].map((song) => (
              <div
                key={song.id}
                className="flex items-center gap-2 px-3 py-2 text-sm border-b last:border-b-0 transition-colors cursor-pointer"
                style={{
                  borderColor: "var(--color-border)",
                }}
                onClick={() => onSelect(song.id)}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor =
                    "var(--color-surface-elevated)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent")
                }
              >
                <div className="flex-1 min-w-0">
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
                  style={{ color: "var(--color-accent)" }}
                  aria-label={`Add ${song.title}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const SongSearchList = memo(SongSearchListFn);
export default SongSearchList;
