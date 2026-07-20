"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { SetlistWithSections } from "@/lib/type";
import { useIsGuest } from "@/lib/hooks/useIsGuest";
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="greet-icon">
        <path d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.166 5.106a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.061l-1.06-1.06a.75.75 0 0 1 0-1.06ZM3.75 11.25H2.25a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5Z" />
        <path d="M12 14.25a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
        <path d="M3.75 17.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" />
        <path d="M17.834 5.106a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Z" />
        <path d="M21.75 11.25h-1.5a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5Z" />
      </svg>
    );
  } else if (isAfternoon) {
    greeting = "Good afternoon";
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="greet-icon">
        <path d="M6.75 8.25a5.25 5.25 0 0 1 10.335-1.313 4.125 4.125 0 0 1 1.665 7.813H7.125a3.75 3.75 0 0 1-.375-7.5Z" />
        <path d="M8.25 18.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z" />
        <path d="M9.75 21a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z" />
      </svg>
    );
  } else {
    greeting = "Good evening";
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="greet-icon">
        <path d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
        <path d="M18 2.25a.75.75 0 0 1 .75.75v.75h.75a.75.75 0 0 1 0 1.5h-.75v.75a.75.75 0 0 1-1.5 0v-.75h-.75a.75.75 0 0 1 0-1.5h.75V3a.75.75 0 0 1 .75-.75Z" />
        <path d="M20.25 7.5a.75.75 0 0 1 .75.75v.375h.375a.75.75 0 0 1 0 1.5H21v.375a.75.75 0 0 1-1.5 0V9.625h-.375a.75.75 0 0 1 0-1.5h.375V8.25a.75.75 0 0 1 .75-.75Z" />
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
        .greet-icon {
          display: inline;
          width: 1.35em;
          height: 1.35em;
          fill: var(--color-accent);
          vertical-align: -0.2em;
          animation: greet-fade-slide 0.6s ease-out both;
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
  const isGuest = useIsGuest();
  const [todayLocal, setTodayLocal] = useState("");
  const [showPast, setShowPast] = useState(false);

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
          href={isGuest ? "#" : "/setlists/new"}
          onClick={(e) => {
            if (isGuest) {
              e.preventDefault();
              toast.error("Guests can't schedule a lineup");
            }
          }}
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
          <hr className="my-8" style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />
          <button
            onClick={() => setShowPast((prev) => !prev)}
            className="flex items-center gap-3 w-full mb-3 text-left transition-opacity hover:opacity-80"
          >
            <hr className="flex-1" style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />
            <span className="text-sm font-semibold whitespace-nowrap" style={{ color: "var(--color-text)" }}>
              Past lineups
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-5 h-5 shrink-0 transition-transform duration-200 ${showPast ? "rotate-180" : ""}`}
              style={{ color: "var(--color-text-tertiary)" }}
            >
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
          {showPast && (
            <div className="flex flex-col gap-2 sm:gap-3">
              {pastSetlists.map((setlist) => (
                <SetlistPreviewCard key={setlist.id} setlist={setlist} defaultOpen={false} isPast />
              ))}
            </div>
          )}
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
