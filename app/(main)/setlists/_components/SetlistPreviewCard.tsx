"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { SetlistWithSections, ADMIN_EMAIL } from "@/lib/type";
import { getBranchLabel } from "@/lib/branches";
import ChordsViewer from "@/components/setlists/setlist-detail/ChordsViewer";
import LyricsViewer from "@/components/setlists/setlist-detail/LyricsViewer";

const SECTION_TYPES = ["worship", "praise", "altar_call", "tithes_offering", "special"];

const SECTION_LABELS: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
  altar_call: "Altar Call",
  tithes_offering: "Tithes and offering",
  special: "Special numbers",
};

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type SetlistPreviewCardProps = {
  setlist: SetlistWithSections;
  defaultOpen: boolean;
  isPast?: boolean;
};

export default function SetlistPreviewCard({
  setlist,
  defaultOpen,
  isPast,
}: SetlistPreviewCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [sections, setSections] = useState(setlist.sections);
  const [copiedText, setCopiedText] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState(setlist.spotify_playlist_url);
  const [chordsView, setChordsView] = useState<{ sectionType: string; songId: string } | null>(null);
  const [lyricsView, setLyricsView] = useState<{ sectionType: string; songId: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
    });
  }, []);

  function toggleOpen() {
    setIsOpen((prev) => !prev);
  }

  function getSongsForType(type: string) {
    return sections
      .filter((s) => s.section_type === type)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function getKey(s: typeof sections[number]) {
    return s.song_key ?? s.songs.default_key ?? "G";
  }

  async function handleCreatePlaylist(e: React.MouseEvent) {
    e.stopPropagation();
    if (sections.length === 0) {
      toast.error("This lineup has no songs");
      return;
    }
    setIsCreatingPlaylist(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      toast.error("You must be logged in");
      setIsCreatingPlaylist(false);
      return;
    }

    const res = await fetch(`/api/setlists/${setlist.id}/spotify-playlist`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setSpotifyUrl(data.playlistUrl);
      toast.success("Spotify playlist created!", {
        action: { label: "Open", onClick: () => window.open(data.playlistUrl, "_blank") },
      });
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({ error: "" }));
      if (err.error?.includes("not connected")) {
        toast.error("Spotify not connected. Go to Admin → Spotify to connect.");
      } else {
        toast.error(err.error || "Failed to create playlist");
      }
    }
    setIsCreatingPlaylist(false);
  }

  function handleCopy() {
    const sectionLabels: Record<string, string> = {
      worship: "Worship",
      praise: "Praise",
      altar_call: "Altar Call",
      tithes_offering: "Tithes and offering",
      special: "Special numbers",
    };
    let text = formatDisplayDate(setlist.date);
    if (setlist.song_leader) text += ` — ${setlist.song_leader}`;
    if (setlist.title) text += `\n${setlist.title}`;
    if (setlist.description) text += `\n${setlist.description}`;
    for (const type of SECTION_TYPES) {
      const sectionSongs = getSongsForType(type);
      if (sectionSongs.length > 0) {
        text += `\n\n${sectionLabels[type] ?? type}`;
        for (const s of sectionSongs) {
          const key = getKey(s);
          text += `\n• [${key}] ${s.songs.title}`;
          if (s.songs.author) text += ` (${s.songs.author})`;
          if (s.notes) text += ` — "${s.notes}"`;
        }
      }
    }
    text += `\n\n${window.location.origin}/setlists/${setlist.id}`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success("Lineup preview copied to clipboard");
    setTimeout(() => setCopiedText(false), 10000);
  }

  const isAnniversary = setlist.title?.toLowerCase().includes("anniversary") ?? false;

  return (
    <>
      <div
        className={`relative rounded-xl transition-all overflow-visible ${isPast ? "opacity-60" : ""}`}
        style={{
          backgroundColor: isAnniversary ? "var(--card-anniversary-bg)" : "var(--color-surface-card)",
          border: "1px solid var(--color-border)",
          boxShadow: isAnniversary ? "var(--card-anniversary-bevel)" : undefined,
        }}
      >
        {/* Anniversary: corner glow */}
        {isAnniversary && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none z-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 65% at 92% 8%, var(--card-anniversary-glow) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />
        )}

        {/* Anniversary: shimmer across border */}
        {isAnniversary && (
          <div className="absolute inset-0 rounded-xl pointer-events-none z-0 overflow-hidden celebration-shimmer" aria-hidden="true" />
        )}

        {/* Anniversary: single decorative sparkle */}
        {isAnniversary && (
          <svg
            viewBox="0 0 24 24"
            fill="var(--color-accent)"
            className="absolute bottom-3 right-3 w-14 h-14 sm:w-16 sm:h-16 pointer-events-none z-0"
            style={{ opacity: 0.06 }}
            aria-hidden="true"
          >
            <path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74z" />
          </svg>
        )}

        {/* Header - always visible, clickable to toggle */}
        <div
          className="relative z-10 p-3 sm:p-4 cursor-pointer select-none"
          onClick={toggleOpen}
        >
          {/* Mobile layout */}
          <div className="flex flex-col gap-1.5 sm:hidden">
            {/* Row 1: Date | Chevron + Copy */}
            <div className="flex items-center justify-between">
              <p
                className="font-bold text-base shrink-0"
                style={{ color: "var(--color-accent)" }}
              >
                {formatDisplayDate(setlist.date)}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOpen();
                  }}
                  className="rounded-lg p-1.5 transition-colors hover:bg-(--color-surface-muted) flex items-center justify-center"
                  style={{ color: "var(--color-text-tertiary)" }}
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
                  style={{
                    backgroundColor: copiedText ? "var(--color-success)" : "var(--color-accent)",
                    color: "var(--color-text-on-accent)",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                    <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
                  </svg>
                  {copiedText ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Row 2: Title | Spotify */}
            <div className="flex items-center justify-between gap-2">
              {setlist.title && (
                <p className="text-sm font-medium truncate min-w-0" style={{ color: "var(--color-text)" }}>
                  {setlist.title}
                </p>
              )}
              <div className="shrink-0 flex items-center gap-1.5">
                {spotifyUrl ? (
                  <>
                    <a
                      href={spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
                      style={{ backgroundColor: "#1DB954", color: "#fff" }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.781.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Spotify
                    </a>
                    {isAdmin && (
                      <button
                        onClick={handleCreatePlaylist}
                        disabled={isCreatingPlaylist}
                        title="Regenerate playlist"
                        className="rounded-lg px-2 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                        style={{ border: "1px solid var(--color-border)", color: "var(--color-text-tertiary)" }}
                      >
                        {isCreatingPlaylist ? (
                          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "↻"
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={isCreatingPlaylist}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                    style={{ backgroundColor: "#1DB954", color: "#fff" }}
                  >
                    {isCreatingPlaylist ? (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.781.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    )}
                    {isCreatingPlaylist ? "" : "Playlist"}
                  </button>
                )}
              </div>
            </div>

            {/* Row 3: Description (conditional) */}
            {setlist.description && (
              <p className="text-xs italic" style={{ color: "var(--color-text-tertiary)" }}>
                {setlist.description}
              </p>
            )}

            {/* Row 4: Song Leader | Branch + Anniversary */}
            {(setlist.song_leader || setlist.branch) && (
              <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                {setlist.song_leader && (
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 shrink-0"
                      style={{
                        backgroundColor: "var(--color-accent)",
                        mask: "url(/microphone-with-cable.svg) no-repeat center / contain",
                        WebkitMask: "url(/microphone-with-cable.svg) no-repeat center / contain",
                      }}
                    />
                    {setlist.song_leader}
                  </span>
                )}
                {setlist.song_leader && setlist.branch && (
                  <span className="opacity-40">|</span>
                )}
                {setlist.branch && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {getBranchLabel(setlist.branch)}
                  </span>
                )}
                {isAnniversary && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full italic"
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                      color: "var(--color-accent)",
                    }}
                  >
                    Anniversary
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Desktop layout (hidden on mobile) */}
          <div className="hidden sm:flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p
                  className="font-bold text-base"
                  style={{ color: "var(--color-accent)" }}
                >
                  {formatDisplayDate(setlist.date)}
                </p>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                    color: "var(--color-accent)",
                  }}
                >
                  {getBranchLabel(setlist.branch)}
                </span>
                {isAnniversary && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 italic"
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                      color: "var(--color-accent)",
                    }}
                  >
                    Anniversary
                  </span>
                )}
              </div>
              {setlist.title && (
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  {setlist.title}
                </p>
              )}
              {setlist.description && (
                <p className="text-xs italic mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                  {setlist.description}
                </p>
              )}
              {setlist.song_leader && (
                <div className="mt-1.5">
                  <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--color-text-tertiary)" }}>
                    <span
                      className="inline-block w-3 h-3 shrink-0"
                      style={{
                        backgroundColor: "var(--color-accent)",
                        mask: "url(/microphone-with-cable.svg) no-repeat center / contain",
                        WebkitMask: "url(/microphone-with-cable.svg) no-repeat center / contain",
                      }}
                    />
                    {setlist.song_leader}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-start gap-1.5 shrink-0 pt-0.5">
              {spotifyUrl ? (
                <>
                  <a
                    href={spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
                    style={{ backgroundColor: "#1DB954", color: "#fff" }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.781.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Spotify
                  </a>
                  {isAdmin && (
                    <button
                      onClick={handleCreatePlaylist}
                      disabled={isCreatingPlaylist}
                      title="Regenerate playlist"
                      className="rounded-lg px-2 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                      style={{ border: "1px solid var(--color-border)", color: "var(--color-text-tertiary)" }}
                    >
                      {isCreatingPlaylist ? (
                        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "↻"
                      )}
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleCreatePlaylist}
                  disabled={isCreatingPlaylist}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  style={{ backgroundColor: "#1DB954", color: "#fff" }}
                >
                  {isCreatingPlaylist ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.781.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  )}
                  {isCreatingPlaylist ? "" : "Playlist"}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
                style={{
                  backgroundColor: copiedText ? "var(--color-success)" : "var(--color-accent)",
                  color: "var(--color-text-on-accent)",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                  <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
                </svg>
                {copiedText ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOpen();
                }}
                className="rounded-lg p-1.5 transition-colors hover:bg-(--color-surface-muted) flex items-center justify-center"
                style={{ color: "var(--color-text-tertiary)" }}
                aria-label={isOpen ? "Collapse" : "Expand"}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                >
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Expanded content */}
        {isOpen && (
          <div className="relative px-3 sm:px-4 pb-3 sm:pb-4 border-t overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
            {/* Anniversary confetti background */}
            {isAnniversary && (
              <svg
                viewBox="0 0 400 300"
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="xMidYMid slice"
                style={{ opacity: 0.18 }}
                aria-hidden="true"
              >
                <rect x="28" y="18" width="10" height="5" rx="1" fill="#DC2626" transform="rotate(-18 33 20.5)" />
                <rect x="145" y="32" width="8" height="4" rx="1" fill="#2563EB" transform="rotate(30 149 34)" />
                <rect x="290" y="14" width="9" height="4.5" rx="1" fill="#16A34A" transform="rotate(-28 294.5 16.25)" />
                <rect x="360" y="42" width="7" height="3.5" rx="1" fill="#CA8A04" transform="rotate(40 363.5 43.75)" />
                <rect x="78" y="85" width="9" height="4.5" rx="1" fill="#2563EB" transform="rotate(-35 82.5 87.25)" />
                <rect x="220" y="72" width="8" height="4" rx="1" fill="#DC2626" transform="rotate(22 224 74)" />
                <rect x="330" y="95" width="10" height="5" rx="1" fill="#16A34A" transform="rotate(-12 335 97.5)" />
                <rect x="50" y="140" width="7" height="3.5" rx="1" fill="#CA8A04" transform="rotate(48 53.5 141.75)" />
                <rect x="180" y="128" width="9" height="4.5" rx="1" fill="#DC2626" transform="rotate(-42 184.5 130.25)" />
                <rect x="310" y="150" width="8" height="4" rx="1" fill="#2563EB" transform="rotate(15 314 152)" />
                <rect x="100" y="195" width="10" height="5" rx="1" fill="#16A34A" transform="rotate(-22 105 197.5)" />
                <rect x="250" y="185" width="7" height="3.5" rx="1" fill="#CA8A04" transform="rotate(38 253.5 186.75)" />
                <rect x="15" y="245" width="8" height="4" rx="1" fill="#DC2626" transform="rotate(-32 19 247)" />
                <rect x="160" y="238" width="9" height="4.5" rx="1" fill="#2563EB" transform="rotate(25 164.5 240.25)" />
                <rect x="370" y="215" width="7" height="3.5" rx="1" fill="#16A34A" transform="rotate(-45 373.5 216.75)" />
                <circle cx="55" cy="55" r="4" fill="#CA8A04" />
                <circle cx="195" cy="48" r="3.5" fill="#DC2626" />
                <circle cx="345" cy="62" r="3" fill="#2563EB" />
                <circle cx="115" cy="115" r="3.5" fill="#16A34A" />
                <circle cx="270" cy="108" r="4" fill="#CA8A04" />
                <circle cx="40" cy="175" r="3" fill="#2563EB" />
                <circle cx="230" cy="162" r="3.5" fill="#DC2626" />
                <circle cx="380" cy="178" r="3" fill="#16A34A" />
                <circle cx="130" cy="225" r="4" fill="#CA8A04" />
                <circle cx="300" cy="232" r="3.5" fill="#2563EB" />
                <circle cx="65" cy="275" r="3" fill="#DC2626" />
                <circle cx="350" cy="268" r="3.5" fill="#16A34A" />
              </svg>
            )}
            <div className="relative z-10 flex flex-col gap-1.5 pt-2">
              {SECTION_TYPES.map((type) => {
                const sectionSongs = getSongsForType(type);
                if (sectionSongs.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className="text-[11px] uppercase tracking-wider font-semibold"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {SECTION_LABELS[type] ?? type}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChordsView({ sectionType: type, songId: sectionSongs[0].id });
                          }}
                          className="text-xs font-semibold rounded-lg px-3 py-1.5 flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:scale-95"
                          style={{ backgroundColor: "transparent", border: "1.5px solid var(--color-accent)", color: "var(--color-accent)" }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M9 4.318A1 1 0 0 1 10.366 3.5l5.19 1.298A1 1 0 0 1 16 5.75v8.534a2.5 2.5 0 0 1-1.744 2.394l-1.838.613a2.5 2.5 0 0 1-3.156-1.662l-.747-2.611A2.5 2.5 0 0 1 9 10.358V4.318Z" />
                          </svg>
                          Chords
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLyricsView({ sectionType: type, songId: sectionSongs[0].id });
                          }}
                          className="text-xs font-semibold rounded-lg px-3 py-1.5 flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:scale-95"
                          style={{ backgroundColor: "var(--color-accent-secondary)", color: "var(--color-text-on-accent-secondary)" }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
                          </svg>
                          Lyrics
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {sectionSongs.map((s) => (
                        <div key={s.id}>
                          <p className="text-[11px] break-words" style={{ color: "var(--color-text)" }}>
                            {s.songs.title}
                            {s.songs.author && (
                              <span className="ml-1.5" style={{ color: "var(--color-text-tertiary)" }}>
                                ({s.songs.author})
                              </span>
                            )}
                          </p>
                          {s.notes && (
                            <p className="text-[10px] italic" style={{ color: "var(--color-text-tertiary)" }}>
                              &ldquo;{s.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Full Lineup bar - always visible */}
        <Link
          href={`/setlists/${setlist.id}`}
          onClick={(e) => e.stopPropagation()}
          className="block w-full rounded-b-xl px-4 py-2.5 text-sm font-semibold text-center transition-all hover:opacity-90"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-text-on-accent)",
          }}
        >
          View Full Lineup &rarr;
        </Link>
      </div>

      {chordsView && (
        <ChordsViewer
          setlist={setlist}
          sections={sections}
          sectionType={chordsView.sectionType}
          onClose={() => setChordsView(null)}
          onSectionsChange={(updater) => setSections(updater)}
        />
      )}

      {lyricsView && (
        <LyricsViewer
          sections={sections}
          sectionType={lyricsView.sectionType}
          onClose={() => setLyricsView(null)}
        />
      )}
    </>
  );
}
