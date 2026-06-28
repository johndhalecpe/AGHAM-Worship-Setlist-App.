import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SetlistWithSections } from "@/lib/type";
import { todayLocalISO } from "@/lib/dates";
import SetlistPreviewCard from "./_components/SetlistPreviewCard";

export const dynamic = "force-dynamic";

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


export default async function SetlistsPage() {
  const setlists = await fetchAllSetlists();
  const todayISOString = todayLocalISO();

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

      <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
        Upcoming lineups
      </h3>
      {upcomingSetlists.length > 0 ? (
        <div className="flex flex-col gap-3 sm:gap-4">
          {upcomingSetlists.map((setlist) => (
            <Link key={setlist.id} href={`/setlists/${setlist.id}`}>
              <SetlistPreviewCard setlist={setlist} />
            </Link>
          ))}
        </div>
      ) : (
        <p
          className="text-sm"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          No scheduled lineups for now...
        </p>
      )}

      {pastSetlists.length > 0 && (
        <>
          <hr
            className="my-16"
            style={{
              border: "none",
              borderTop: "1px solid var(--color-border)",
            }}
          />
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
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
    </div>
  );
}
