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

  function getKey(s: SetlistSectionWithSong) {
    return s.song_key ?? s.songs.default_key ?? "G";
  }

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
                  .filter((s) => s.section_type === type)
                  .sort((a, b) => a.sort_order - b.sort_order);
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
              text += `\n\n${window.location.href}`;
              navigator.clipboard.writeText(text);
              setCopiedText(true);
              setTimeout(() => setCopiedText(false), 10000);
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 shrink-0"
            style={{
              backgroundColor: copiedText ? "var(--color-success)" : "var(--color-accent)",
              color: "var(--color-text-on-accent)",
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
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "var(--color-accent)" }}>
              Worship
            </p>
            {sections
              .filter((s) => s.section_type === "worship")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((s) => (
                <p key={s.id} className="ml-2 break-words">
                  • <span className="opacity-70">[{getKey(s)}]</span> {s.songs.title}
                  {s.songs.author && <span className="opacity-60"> ({s.songs.author})</span>}
                  {s.notes && <span className="italic opacity-60"> — &ldquo;{s.notes}&rdquo;</span>}
                </p>
              ))}
          </>
        )}
        {sections.filter((s) => s.section_type === "praise").length > 0 && (
          <>
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "var(--color-accent)" }}>
              Praise
            </p>
            {sections
              .filter((s) => s.section_type === "praise")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((s) => (
                <p key={s.id} className="ml-2 break-words">
                  • <span className="opacity-70">[{getKey(s)}]</span> {s.songs.title}
                  {s.songs.author && <span className="opacity-60"> ({s.songs.author})</span>}
                  {s.notes && <span className="italic opacity-60"> — &ldquo;{s.notes}&rdquo;</span>}
                </p>
              ))}
          </>
        )}
        {sections.filter((s) => s.section_type === "tithes_offering").length > 0 && (
          <>
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "var(--color-accent)" }}>
              Tithes and offering
            </p>
            {sections
              .filter((s) => s.section_type === "tithes_offering")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((s) => (
                <p key={s.id} className="ml-2 break-words">
                  • <span className="opacity-70">[{getKey(s)}]</span> {s.songs.title}
                  {s.songs.author && <span className="opacity-60"> ({s.songs.author})</span>}
                  {s.notes && <span className="italic opacity-60"> — &ldquo;{s.notes}&rdquo;</span>}
                </p>
              ))}
          </>
        )}
        {sections.filter((s) => s.section_type === "special").length > 0 && (
          <>
            <p className="mt-3 font-semibold uppercase tracking-wider text-xs" style={{ color: "var(--color-accent)" }}>
              Special numbers
            </p>
            {sections
              .filter((s) => s.section_type === "special")
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((s) => (
                <p key={s.id} className="ml-2 break-words">
                  • <span className="opacity-70">[{getKey(s)}]</span> {s.songs.title}
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
