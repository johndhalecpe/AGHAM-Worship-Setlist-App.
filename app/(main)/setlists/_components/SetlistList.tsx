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
        @keyframes greet-spotlight {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(400%) skewX(-15deg); }
        }
        .greet-wrapper {
          position: relative;
          display: inline-block;
          overflow: hidden;
          isolation: isolate;
          animation: greet-fade-slide 0.6s ease-out both;
        }
        .greet-wrapper::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 60px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.45),
            transparent
          );
          transform: translateX(-100%) skewX(-15deg);
          animation: greet-spotlight 3s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>
      <p className="text-xl font-bold mb-1" style={{ color: "var(--color-accent)" }}>
        <span className="greet-wrapper">{icon} {greeting}, {name}</span>
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
