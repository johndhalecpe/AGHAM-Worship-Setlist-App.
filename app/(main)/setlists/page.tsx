import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SetlistWithSections } from "@/lib/type";

export const dynamic = "force-dynamic";

const SECTION_LABELS: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
};

async function fetchAllSetlists(): Promise<SetlistWithSections[]> {
  const { data, error } = await supabase
    .from("setlists")
    .select(
      `
      *,
      sections:setlist_sections(
        *,
        songs(id, title, author, category, language)
      )
    `
    )
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((setlist: Record<string, unknown>) => {
    const sections = (setlist.sections as Record<string, unknown>[] ?? []).map(
      (s: Record<string, unknown>) => ({
        ...s,
        songs: s.songs as SetlistWithSections["sections"][number]["songs"],
      })
    ) as SetlistWithSections["sections"];

    sections.sort((a, b) => a.sort_order - b.sort_order);

    return {
      ...setlist,
      sections,
    } as SetlistWithSections;
  });
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function SectionSongList({
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
              className={`text-sm ${dimmed ? "opacity-60" : ""}`}
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

function SetlistPreviewCard({
  setlist,
  dimmed,
}: {
  setlist: SetlistWithSections;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 sm:p-6 transition-all hover:-translate-y-0.5 ${dimmed ? "opacity-50" : ""}`}
      style={{
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
        ...(dimmed ? { filter: "grayscale(0.3)" } : {}),
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0 mb-4">
        <div>
          <p
            className={`font-bold text-lg ${dimmed ? "opacity-70" : ""}`}
            style={{ color: "var(--color-text)" }}
          >
            {formatDisplayDate(setlist.date)}
          </p>
          {setlist.title && (
            <p
              className={`text-sm mt-0.5 ${dimmed ? "opacity-60" : ""}`}
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
        </div>
        {setlist.song_leader && (
          <div className="flex items-center gap-1.5 text-sm shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-3.5 h-3.5 ${dimmed ? "opacity-60" : ""}`}
              style={{ color: "#D84F0B" }}
            >
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
            <span
              className={dimmed ? "opacity-60" : ""}
              style={{ color: "var(--color-text-secondary)" }}
            >
              {setlist.song_leader}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
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
          className={`mt-3 text-xs ${dimmed ? "opacity-60" : ""}`}
          style={{ color: "var(--color-text-tertiary)" }}
        >
          + more sections &rarr;
        </p>
      )}
    </div>
  );
}

export default async function SetlistsPage() {
  const setlists = await fetchAllSetlists();
  const todayISOString = new Date().toISOString().split("T")[0];

  const upcomingSetlists = setlists
    .filter((s) => s.date >= todayISOString)
    .sort((a, b) => a.date.localeCompare(b.date));

  const pastSetlists = setlists
    .filter((s) => s.date < todayISOString)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2
          className="text-xl sm:text-2xl font-bold"
          style={{ color: "var(--color-text)" }}
        >
          Lineups
        </h2>
        <Link
          href="/setlists/new"
          className="rounded-lg px-4 py-2 text-sm font-medium text-center transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          style={{
            backgroundColor: "#D84F0B",
            color: "var(--color-surface-card)",
          }}
        >
          Add a Lineup
        </Link>
      </div>

          {upcomingSetlists.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
            Upcoming lineups
          </h3>
          <div className="flex flex-col gap-3 sm:gap-4">
            {upcomingSetlists.map((setlist) => (
              <Link key={setlist.id} href={`/setlists/${setlist.id}`}>
                <SetlistPreviewCard setlist={setlist} />
              </Link>
            ))}
          </div>
        </>
      )}

      {pastSetlists.length > 0 && (
        <>
      {upcomingSetlists.length > 0 && (
            <hr
              className="my-8"
              style={{
                border: "none",
                borderTop: "1px solid var(--color-border)",
              }}
            />
          )}
          <h3
            className="text-sm font-semibold uppercase tracking-wider mb-3 opacity-60"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Past lineups
          </h3>
          <div className="flex flex-col gap-3 sm:gap-4">
            {pastSetlists.map((setlist) => (
              <Link key={setlist.id} href={`/setlists/${setlist.id}`}>
                <SetlistPreviewCard setlist={setlist} dimmed />
              </Link>
            ))}
          </div>
        </>
      )}

      {upcomingSetlists.length === 0 && pastSetlists.length === 0 && (
        <p
          className="text-sm"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          No setlists found.
        </p>
      )}
    </div>
  );
}
