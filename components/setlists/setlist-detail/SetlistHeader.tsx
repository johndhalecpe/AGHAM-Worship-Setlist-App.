"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import { getBranchLabel } from "@/lib/branches";
import { getEffectiveSongKey } from "@/lib/setlistHelpers";

type SetlistHeaderProps = {
  setlist: Setlist;
  sections: SetlistSectionWithSong[];
  isLocked: boolean;
  isPast: boolean;
  onEdit: () => void;
  onToggleLock: () => void;
  onDeleteRequest: () => void;
};

const SECTION_TYPES_FOR_COPY = ["worship", "praise", "tithes_offering", "special"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function SetlistHeader({
  setlist,
  sections,
  isLocked,
  isPast,
  onEdit,
  onToggleLock,
  onDeleteRequest,
}: SetlistHeaderProps) {
  const [copiedText, setCopiedText] = useState(false);

  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2
            className="text-xl sm:text-2xl font-bold break-words"
            style={{ color: "var(--color-text)" }}
          >
            {formatDate(setlist.date)}
          </h2>
          <p
            className="mt-0.5 text-sm font-medium"
            style={{ color: "#D84F0B" }}
          >
            {getBranchLabel(setlist.branch)}
          </p>
          {setlist.title && (
            <p
              className="mt-1 text-sm sm:text-base"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {setlist.title}
            </p>
          )}
          {setlist.description && (
            <p
              className="text-sm italic mt-0.5"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {setlist.description}
            </p>
          )}
        </div>
      </div>

      <div
        className="rounded-lg p-4 mb-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-secondary)",
        }}
      >
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="font-semibold" style={{ color: "var(--color-text)" }}>
              {formatDate(setlist.date)}
              {setlist.song_leader && (
                <span className="font-normal" style={{ color: "var(--color-text-secondary)" }}>
                  {" "}— {setlist.song_leader}
                </span>
              )}
            </p>
            {setlist.branch === "carissa_1" && (
              <p className="font-semibold text-[11px] mt-0.5" style={{ color: "var(--color-accent)" }}>
                {getBranchLabel(setlist.branch)}
              </p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const sectionLabels: Record<string, string> = {
                worship: "Worship",
                praise: "Praise",
                tithes_offering: "Tithes and offering",
                special: "Special numbers",
              };
              let text = formatDate(setlist.date);
              if (setlist.song_leader) text += ` — ${setlist.song_leader}`;
              if (setlist.branch === "carissa_1") text += `\n${getBranchLabel(setlist.branch)}`;
              if (setlist.title) text += `\n${setlist.title}`;
              if (setlist.description) text += `\n${setlist.description}`;
              for (const type of SECTION_TYPES_FOR_COPY) {
                const sectionSongs = sections
                  .filter((section) => section.section_type === type)
                  .sort((a, b) => a.sort_order - b.sort_order);
                if (sectionSongs.length > 0) {
                  text += `\n\n${sectionLabels[type] ?? type}`;
                  for (const section of sectionSongs) {
                    const key = getEffectiveSongKey(section);
                    text += `\n• [${key}] ${section.songs.title}`;
                    if (section.songs.author) text += ` (${section.songs.author})`;
                    if (section.notes) text += ` — "${section.notes}"`;
                  }
                }
              }
              text += `\n\n${window.location.href}`;
              navigator.clipboard.writeText(text);
              setCopiedText(true);
              toast.success("Lineup preview copied to clipboard");
              setTimeout(() => setCopiedText(false), 10000);
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 shrink-0 flex items-center gap-1.5"
            style={{
              backgroundColor: copiedText ? "var(--color-success)" : "var(--color-accent)",
              color: "var(--color-text-on-accent)",
            }}
          >
            {copiedText ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                  <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
                </svg>
                Copy text
              </>
            )}
          </button>
        </div>
        {setlist.title && (
          <p className="mt-1 font-semibold" style={{ color: "var(--color-text)" }}>
            {setlist.title}
          </p>
        )}
        {setlist.description && (
          <p className="italic" style={{ color: "var(--color-text-tertiary)" }}>
            {setlist.description}
          </p>
        )}
        {sections.filter((section) => section.section_type === "worship").length > 0 && (
          <>
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "var(--color-accent)" }}>
              Worship
            </p>
            {sections
              .filter((section) => section.section_type === "worship")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((section) => (
                <p key={section.id} className="ml-2 break-words">
                  • <span className="opacity-70">[{getEffectiveSongKey(section)}]</span> {section.songs.title}
                  {section.songs.author && <span className="opacity-60"> ({section.songs.author})</span>}
                  {section.notes && <span className="italic opacity-60"> — &ldquo;{section.notes}&rdquo;</span>}
                </p>
              ))}
          </>
        )}
        {sections.filter((section) => section.section_type === "praise").length > 0 && (
          <>
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "var(--color-accent)" }}>
              Praise
            </p>
            {sections
              .filter((section) => section.section_type === "praise")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((section) => (
                <p key={section.id} className="ml-2 break-words">
                  • <span className="opacity-70">[{getEffectiveSongKey(section)}]</span> {section.songs.title}
                  {section.songs.author && <span className="opacity-60"> ({section.songs.author})</span>}
                  {section.notes && <span className="italic opacity-60"> — &ldquo;{section.notes}&rdquo;</span>}
                </p>
              ))}
          </>
        )}
        {sections.filter((section) => section.section_type === "tithes_offering").length > 0 && (
          <>
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "var(--color-accent)" }}>
              Tithes and offering
            </p>
            {sections
              .filter((section) => section.section_type === "tithes_offering")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((section) => (
                <p key={section.id} className="ml-2 break-words">
                  • <span className="opacity-70">[{getEffectiveSongKey(section)}]</span> {section.songs.title}
                  {section.songs.author && <span className="opacity-60"> ({section.songs.author})</span>}
                  {section.notes && <span className="italic opacity-60"> — &ldquo;{section.notes}&rdquo;</span>}
                </p>
              ))}
          </>
        )}
        {sections.filter((section) => section.section_type === "special").length > 0 && (
          <>
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "var(--color-accent)" }}>
              Special numbers
            </p>
            {sections
              .filter((section) => section.section_type === "special")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((section) => (
                <p key={section.id} className="ml-2 break-words">
                  • <span className="opacity-70">[{getEffectiveSongKey(section)}]</span> {section.songs.title}
                  {section.songs.author && <span className="opacity-60"> ({section.songs.author})</span>}
                  {section.notes && <span className="italic opacity-60"> — &ldquo;{section.notes}&rdquo;</span>}
                </p>
              ))}
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        {setlist.song_leader && (
          <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
            <span
              className="inline-block w-3.5 h-3.5 shrink-0"
              style={{
                backgroundColor: "var(--color-accent)",
                mask: "url(/microphone-with-cable.svg) no-repeat center / contain",
                WebkitMask: "url(/microphone-with-cable.svg) no-repeat center / contain",
              }}
            />
            {setlist.song_leader}
          </p>
        )}
        {!isPast && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onToggleLock}
              className="rounded-lg px-3 py-2 text-xs font-medium transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: isLocked ? "var(--color-accent)" : "var(--color-surface-card)",
                color: isLocked ? "var(--color-text-on-accent)" : "var(--color-text-secondary)",
                border: isLocked ? "none" : "1px solid var(--color-border)",
              }}
            >
              {isLocked ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                  </svg>
                  Unlock
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom">
                    <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 14.5 1Zm-3 8V5.5a3 3 0 1 1 6 0V9h-6Z" clipRule="evenodd" />
                  </svg>
                  Lock
                </>
              )}
            </button>
            {!isLocked && (
              <button
                onClick={onEdit}
                className="rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Edit
              </button>
            )}
            {!isLocked && (
              <button
                onClick={onDeleteRequest}
                className="rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                style={{
                  border: "1px solid var(--color-danger)",
                  color: "var(--color-danger)",
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
