"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { SetlistWithSections } from "@/lib/type";
import { getBranchLabel } from "@/lib/branches";
import ChordsViewer from "@/components/setlists/setlist-detail/ChordsViewer";
import LyricsViewer from "@/components/setlists/setlist-detail/LyricsViewer";

const SECTION_TYPES = ["worship", "praise", "tithes_offering", "special"];

const SECTION_LABELS: Record<string, string> = {
  worship: "Worship",
  praise: "Praise",
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
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [sections, setSections] = useState(setlist.sections);
  const [copiedText, setCopiedText] = useState(false);
  const [chordsView, setChordsView] = useState<{ sectionType: string; songId: string } | null>(null);
  const [lyricsView, setLyricsView] = useState<{ sectionType: string; songId: string } | null>(null);

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

  function handleCopy() {
    const sectionLabels: Record<string, string> = {
      worship: "Worship",
      praise: "Praise",
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

  return (
    <>
      <div
        className={`rounded-xl transition-all ${isPast ? "opacity-60" : ""}`}
        style={{
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Header - always visible, clickable to toggle */}
        <div
          className="p-3 sm:p-4 cursor-pointer select-none"
          onClick={toggleOpen}
        >
          <div className="flex items-start justify-between gap-3">
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
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex flex-col gap-1.5 pt-2">
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
          activeSongId={chordsView.songId}
          onClose={() => setChordsView(null)}
          onSectionsChange={(updater) => setSections(updater)}
        />
      )}

      {lyricsView && (
        <LyricsViewer
          sections={sections}
          sectionType={lyricsView.sectionType}
          activeSongId={lyricsView.songId}
          onClose={() => setLyricsView(null)}
        />
      )}
    </>
  );
}
