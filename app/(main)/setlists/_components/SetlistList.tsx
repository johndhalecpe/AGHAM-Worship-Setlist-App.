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
  const isMorning = hour < 12;
  const isAfternoon = hour < 18;
  let greeting: string;
  let icon: string;
  if (isMorning) { greeting = "Good morning"; icon = "\u{1F305}"; }
  else if (isAfternoon) { greeting = "Good afternoon"; icon = "\u{2600}\u{FE0F}"; }
  else { greeting = "Good evening"; icon = "\u{1F319}"; }

  return (
    <>
      <style>{`
        @keyframes greet-fade-slide {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes greet-shimmer {
          0% { background-position: -100% center; }
          50% { background-position: 0% center; }
          100% { background-position: -100% center; }
        }
        .greet-text {
          background: linear-gradient(
            90deg,
            color-mix(in srgb, var(--color-accent), #fff 8%) 0%,
            color-mix(in srgb, var(--color-accent), #fff 8%) 30%,
            color-mix(in srgb, var(--color-accent), #fff 35%) 45%,
            #fff 50%,
            color-mix(in srgb, var(--color-accent), #fff 35%) 55%,
            color-mix(in srgb, var(--color-accent), #fff 8%) 70%,
            color-mix(in srgb, var(--color-accent), #fff 8%) 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: greet-fade-slide 0.6s ease-out both,
                     greet-shimmer 3s ease-in-out infinite 0.6s;
        }
      `}</style>
      <p className="text-xl font-bold mb-1">
        <span className="greet-text">{icon} {greeting}, {name}</span>
      </p>
    </>
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

      {upcomingSetlists.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
            Upcoming lineups
          </h3>
          <div className="flex flex-col gap-2 sm:gap-3 mb-8">
            {upcomingSetlists.map((setlist) => (
              <SetlistPreviewCard key={setlist.id} setlist={setlist} defaultOpen />
            ))}
          </div>
        </>
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
              <SetlistPreviewCard key={setlist.id} setlist={setlist} defaultOpen={false} isPast />
            ))}
          </div>
        </>
      )}

      {upcomingSetlists.length === 0 && (
        <p
          className="text-sm"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          No scheduled lineups for now...
        </p>
      )}
    </div>
  );
}
