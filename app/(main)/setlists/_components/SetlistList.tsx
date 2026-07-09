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
  let icon: React.ReactNode;
  if (isMorning) {
    greeting = "Good morning";
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 inline-block align-text-bottom">
        <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
      </svg>
    );
  } else if (isAfternoon) {
    greeting = "Good afternoon";
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 inline-block align-text-bottom">
        <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
      </svg>
    );
  } else {
    greeting = "Good evening";
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 inline-block align-text-bottom">
        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
      </svg>
    );
  }

  return (
    <>
      <style>{`
        @keyframes greet-fade-slide {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes greet-shimmer {
          0% { background-position: 150% center; }
          100% { background-position: -50% center; }
        }
        .greet-text {
          background: linear-gradient(
            90deg,
            var(--color-accent) 0%,
            var(--color-accent) 47%,
            rgba(255,255,255,0.6) 49%,
            #fff 50%,
            rgba(255,255,255,0.6) 51%,
            var(--color-accent) 53%,
            var(--color-accent) 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: greet-fade-slide 0.6s ease-out both,
                     greet-shimmer 6s ease-in-out infinite 0.6s;
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
