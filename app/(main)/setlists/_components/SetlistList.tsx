"use client";

import Link from "next/link";
import { SetlistWithSections } from "@/lib/type";
import SetlistPreviewCard from "./SetlistPreviewCard";

type SetlistListProps = {
  setlists: SetlistWithSections[];
};

export default function SetlistList({ setlists }: SetlistListProps) {
  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const upcomingSetlists = setlists
    .filter((s) => s.date >= todayLocal)
    .sort((a, b) => a.date.localeCompare(b.date));

  const pastSetlists = setlists
    .filter((s) => s.date < todayLocal)
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
