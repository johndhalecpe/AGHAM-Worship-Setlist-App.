import { SetlistWithSections } from "@/lib/type";
import { getBranchLabel } from "@/lib/branches";
import SectionSongList from "./SectionSongList";

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type SetlistPreviewCardProps = {
  setlist: SetlistWithSections;
  dimmed?: boolean;
};

export default function SetlistPreviewCard({
  setlist,
  dimmed,
}: SetlistPreviewCardProps) {
  return (
    <div
      className={`relative rounded-xl p-4 sm:p-6 transition-all hover:-translate-y-0.5 ${dimmed ? "opacity-50" : ""}`}
      style={{
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
        ...(dimmed ? { filter: "grayscale(0.3)" } : {}),
      }}
    >
      <span
        className={`absolute top-3 right-3 text-xs font-semibold ${dimmed ? "opacity-60" : ""}`}
        style={{ color: "#D84F0B" }}
      >
        {getBranchLabel(setlist.branch)}
      </span>
      <div className="flex items-start justify-between gap-4 mb-3">
        <p
          className={`font-bold text-lg ${dimmed ? "opacity-70" : ""}`}
          style={{ color: "var(--color-text)" }}
        >
          {formatDisplayDate(setlist.date)}
        </p>
      </div>

      {setlist.title && (
        <p
          className={`text-sm ${dimmed ? "opacity-60" : ""}`}
          style={{ color: "var(--color-text-secondary)" }}
        >
          {setlist.title}
        </p>
      )}
      {setlist.description && (
        <p
          className={`text-xs italic mt-0.5 ${dimmed ? "opacity-60" : ""}`}
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {setlist.description}
        </p>
      )}

      <div className="flex flex-col gap-3 mt-3">
        <SectionSongList
          sectionType="worship"
          sections={setlist.sections}
          dimmed={dimmed}
        />
        <SectionSongList
          sectionType="praise"
          sections={setlist.sections}
          dimmed={dimmed}
        />
      </div>

      {setlist.sections.filter(
        (s) => s.section_type !== "worship" && s.section_type !== "praise"
      ).length > 0 && (
        <p
          className={`mt-2 text-xs ${dimmed ? "opacity-60" : ""}`}
          style={{ color: "var(--color-text-tertiary)" }}
        >
          + more sections &rarr;
        </p>
      )}

      {setlist.song_leader && (
        <div className={`mt-3 ${dimmed ? "opacity-60" : ""}`}>
          <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-tertiary)" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3 h-3"
              style={{ color: "#D84F0B" }}
            >
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
            {setlist.song_leader}
          </span>
        </div>
      )}
    </div>
  );
}
