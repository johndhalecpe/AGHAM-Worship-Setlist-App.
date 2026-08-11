"use client";

import type { SongListItem } from "@/lib/type";

type Props = {
  currentSong: SongListItem | null;
  prevSong: SongListItem | null;
  nextSong: SongListItem | null;
  hasPrevious: boolean;
  hasNext: boolean;
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
};

export default function SongNavBar({
  prevSong,
  hasPrevious,
  hasNext,
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div
      className="sticky bottom-0 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 py-2 flex items-center justify-between gap-3 min-h-[44px] sm:min-h-[32px] border-t backdrop-blur-xl"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        aria-label="Previous song"
        className="min-w-[96px] min-h-[44px] sm:min-h-[32px] rounded-lg px-2 py-1 text-xs font-medium flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none hover:opacity-80"
        style={{
          border: "1px solid var(--color-border)",
          color: "var(--color-text-secondary)",
        }}
      >
        Previous
      </button>
      <div className="flex flex-col items-center min-w-0 text-center">
        <span
          className="text-xs truncate max-w-[40vw]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {prevSong?.title ?? ""}
        </span>
        <span
          className="text-xs font-medium tabular-nums"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Song {currentIndex + 1} of {totalCount}
        </span>
      </div>
      <button
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next song"
        className="min-w-[96px] min-h-[44px] sm:min-h-[32px] rounded-lg px-2 py-1 text-xs font-medium flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none hover:opacity-80"
        style={{
          border: "1px solid var(--color-border)",
          color: "var(--color-text-secondary)",
        }}
      >
        Next
      </button>
    </div>
  );
}