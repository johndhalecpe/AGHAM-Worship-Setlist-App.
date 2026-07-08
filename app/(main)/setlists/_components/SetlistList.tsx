"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SetlistWithSections } from "@/lib/type";
import SetlistPreviewCard from "./SetlistPreviewCard";

function Greeting() {
  const [name, setName] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      if (profile) setName(profile.name);
    })();
  }, []);

  if (!name) return null;

  const hour = new Date().getHours();
  let greeting: string;
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  return (
    <p className="text-base font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
      {greeting}, {name}
    </p>
  );
}

type SetlistListProps = {
  setlists: SetlistWithSections[];
};

export default function SetlistList({ setlists }: SetlistListProps) {
  const [todayLocal, setTodayLocal] = useState("");

  useEffect(() => {
    const now = new Date();
    setTodayLocal(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    );
  }, []);

  const upcomingSetlists = todayLocal
    ? setlists.filter((s) => s.date >= todayLocal).sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const pastSetlists = todayLocal
    ? setlists.filter((s) => s.date < todayLocal).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div>
      <Greeting />
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2
          className="text-lg sm:text-xl font-bold"
          style={{ color: "var(--color-text)" }}
        >
          Lineups
        </h2>
        <Link
          href="/setlists/new"
          className="rounded-lg px-4 py-2 text-sm font-medium text-center transition-all hover:-translate-y-0.5 w-full sm:w-auto"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-text-on-accent)",
          }}
        >
          Schedule a lineup
        </Link>
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
        Upcoming lineups
      </h3>
      {upcomingSetlists.length > 0 ? (
        <div className="flex flex-col gap-2 sm:gap-3">
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
            className="my-8"
            style={{
              border: "none",
              borderTop: "1px solid var(--color-border)",
            }}
          />
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
            Past lineups
          </h3>
          <div className="flex flex-col gap-2 sm:gap-3">
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
