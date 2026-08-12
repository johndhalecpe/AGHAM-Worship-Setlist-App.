"use client";

type Props = {
  hasPrevious: boolean;
  hasNext: boolean;
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
};

export default function SongNavBar({
  hasPrevious,
  hasNext,
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div
      className="sticky bottom-0 z-10 -mx-5 sm:-mx-6 px-5 sm:px-6 py-2 flex items-center gap-3 min-h-[44px] sm:min-h-[32px] border-t backdrop-blur-xl"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        aria-label="Previous song"
        className="flex-1 min-w-0 min-h-[44px] sm:min-h-[32px] rounded-lg px-2 py-1 text-xs font-medium flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none hover:opacity-80"
        style={{
          border: "1px solid var(--color-border)",
          color: "var(--color-text-secondary)",
        }}
      >
        Previous
      </button>
      <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center">
        <span
          className="max-w-full truncate text-xs font-medium tabular-nums"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Song {currentIndex + 1} of {totalCount}
        </span>
      </div>
      <button
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next song"
        className="flex-1 min-w-0 min-h-[44px] sm:min-h-[32px] rounded-lg px-2 py-1 text-xs font-medium flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none hover:opacity-80"
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