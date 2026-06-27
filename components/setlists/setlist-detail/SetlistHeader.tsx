"use client";

import { useState } from "react";
import { Setlist, SetlistSectionWithSong } from "@/lib/type";
import { getBranchLabel } from "@/lib/branches";

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
            <p className="font-semibold text-[11px] mt-0.5" style={{ color: "#D84F0B" }}>
              {getBranchLabel(setlist.branch)}
            </p>
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
              text += `\n${getBranchLabel(setlist.branch)}`;
              if (setlist.title) text += `\n${setlist.title}`;
              if (setlist.description) text += `\n${setlist.description}`;
              for (const type of SECTION_TYPES_FOR_COPY) {
                const sectionSongs = sections
                  .filter((s) => s.section_type === type)
                  .sort((a, b) => a.sort_order - b.sort_order);
                if (sectionSongs.length > 0) {
                  text += `\n\n${sectionLabels[type] ?? type}`;
                  for (const s of sectionSongs) {
                    text += `\n• ${s.songs.title}`;
                    if (s.songs.author) text += ` (${s.songs.author})`;
                    if (s.notes) text += ` — "${s.notes}"`;
                  }
                }
              }
              text += `\n\n${window.location.href}`;
              navigator.clipboard.writeText(text);
              setCopiedText(true);
              setTimeout(() => setCopiedText(false), 10000);
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 shrink-0"
            style={{
              backgroundColor: copiedText ? "#16A34A" : "#D84F0B",
              color: "#fff",
            }}
          >
            {copiedText ? "Copied!" : "Copy text"}
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
        {sections.filter((s) => s.section_type === "worship").length > 0 && (
          <>
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "#D84F0B" }}>
              Worship
            </p>
            {sections
              .filter((s) => s.section_type === "worship")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((s) => (
                <p key={s.id} className="ml-2 break-words">
                  • {s.songs.title}
                  {s.songs.author && <span className="opacity-60"> ({s.songs.author})</span>}
                  {s.notes && <span className="italic opacity-60"> — &ldquo;{s.notes}&rdquo;</span>}
                </p>
              ))}
          </>
        )}
        {sections.filter((s) => s.section_type === "praise").length > 0 && (
          <>
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "#D84F0B" }}>
              Praise
            </p>
            {sections
              .filter((s) => s.section_type === "praise")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((s) => (
                <p key={s.id} className="ml-2 break-words">
                  • {s.songs.title}
                  {s.songs.author && <span className="opacity-60"> ({s.songs.author})</span>}
                  {s.notes && <span className="italic opacity-60"> — &ldquo;{s.notes}&rdquo;</span>}
                </p>
              ))}
          </>
        )}
        {sections.filter((s) => s.section_type === "tithes_offering").length > 0 && (
          <>
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "#D84F0B" }}>
              Tithes and offering
            </p>
            {sections
              .filter((s) => s.section_type === "tithes_offering")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((s) => (
                <p key={s.id} className="ml-2 break-words">
                  • {s.songs.title}
                  {s.songs.author && <span className="opacity-60"> ({s.songs.author})</span>}
                  {s.notes && <span className="italic opacity-60"> — &ldquo;{s.notes}&rdquo;</span>}
                </p>
              ))}
          </>
        )}
        {sections.filter((s) => s.section_type === "special").length > 0 && (
          <>
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "#D84F0B" }}>
              Special numbers
            </p>
            {sections
              .filter((s) => s.section_type === "special")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((s) => (
                <p key={s.id} className="ml-2 break-words">
                  • {s.songs.title}
                  {s.songs.author && <span className="opacity-60"> ({s.songs.author})</span>}
                  {s.notes && <span className="italic opacity-60"> — &ldquo;{s.notes}&rdquo;</span>}
                </p>
              ))}
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        {setlist.song_leader && (
          <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: "#D84F0B" }}
            >
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
            {setlist.song_leader}
          </p>
        )}
        {!isPast && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onToggleLock}
              className="rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              {isLocked ? "Unlock" : "Lock"}
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
                  border: "1px solid #FCA5A5",
                  color: "#DC2626",
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
