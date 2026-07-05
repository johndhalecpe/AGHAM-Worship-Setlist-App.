import { SetlistWithSections } from "@/lib/type";
import { SECTION_TYPE_LABELS } from "@/lib/sectionLabels";

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
    .filter((section) => section.section_type === sectionType)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (sectionSongs.length === 0) return null;

  return (
    <div>
      <h4
        className={`text-xs uppercase tracking-wider font-semibold mb-2 ${dimmed ? "opacity-60" : ""}`}
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {SECTION_TYPE_LABELS[sectionType] ?? sectionType}
      </h4>
      <div className="flex flex-col gap-1.5">
        {sectionSongs.map((section) => (
          <div key={section.id}>
            <p
              className={`text-sm break-words ${dimmed ? "opacity-60" : ""}`}
              style={{ color: "var(--color-text)" }}
            >
              {section.songs.title}
              {section.songs.author && (
                <span
                  className="ml-1.5"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  ({section.songs.author})
                </span>
              )}
            </p>
            {section.notes && (
              <p
                className={`text-xs mt-0.5 ml-2 italic ${dimmed ? "opacity-60" : ""}`}
                style={{ color: "var(--color-text-tertiary)" }}
              >
                &ldquo;{section.notes}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
