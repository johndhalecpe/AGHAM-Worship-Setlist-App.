import { SetlistWithSections } from "@/lib/type";

const SECTION_LABELS: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
  tithes_offering: "Tithes and offering",
  special: "Special numbers",
};

export default function SectionSongList({
  sectionType,
  sections,
  dimmed,
}: {
  sectionType: string;
  sections: SetlistWithSections["sections"];
  dimmed?: boolean;
}) {
  const sectionSongs = sections
    .filter((s) => s.section_type === sectionType)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (sectionSongs.length === 0) return null;

  return (
    <div>
      <h4
        className={`text-xs uppercase tracking-wider font-semibold mb-2 ${dimmed ? "opacity-60" : ""}`}
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {SECTION_LABELS[sectionType] ?? sectionType}
      </h4>
      <div className="flex flex-col gap-1.5">
        {sectionSongs.map((s) => (
          <div key={s.id}>
            <p
              className={`text-sm break-words ${dimmed ? "opacity-60" : ""}`}
              style={{ color: "var(--color-text)" }}
            >
              {s.songs.title}
              {s.songs.author && (
                <span
                  className="ml-1.5"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  ({s.songs.author})
                </span>
              )}
            </p>
            {s.notes && (
              <p
                className={`text-xs mt-0.5 ml-2 italic ${dimmed ? "opacity-60" : ""}`}
                style={{ color: "var(--color-text-tertiary)" }}
              >
                &ldquo;{s.notes}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
