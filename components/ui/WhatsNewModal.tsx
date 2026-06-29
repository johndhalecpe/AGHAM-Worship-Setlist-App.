"use client";

import { useState, useEffect } from "react";

const RELEASE_DATE = new Date("2026-06-29");
const VERSION = "0.1.1";

const changes = [
  {
    title: "Chords",
    description: "Add chord charts to any song. View or edit them right on the song card.",
  },
  {
    title: "Draft mode",
    description: "Songs with missing details save as drafts. No clutter — finish them later.",
  },
  {
    title: "Musical Data section",
    description: "Key, BPM, and time signature are now grouped with a cleaner layout.",
  },
  {
    title: "Song card",
    description: "More compact with less space, fits more on screen.",
  },
  {
    title: "Better song creation",
    description: "Improved form design makes adding new songs faster and easier.",
  },
];

export default function WhatsNewModal() {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const daysSinceRelease = (Date.now() - RELEASE_DATE.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceRelease < 14) {
      setIsExpanded(true);
    }
  }, []);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg transition-all hover:-translate-y-0.5"
        style={{
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text)",
        }}
        aria-label="Open what's new"
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "#D84F0B" }}
        />
        What&rsquo;s New
      </button>
    );
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 w-80 rounded-xl shadow-lg"
      style={{
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#D84F0B15" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="#D84F0B"
              className="w-3.5 h-3.5"
            >
              <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
            What&rsquo;s New
          </h2>
          <span className="text-[11px] font-medium" style={{ color: "var(--color-text-tertiary)" }}>
            v{VERSION}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 rounded transition-colors hover:opacity-80 min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={{ color: "var(--color-text-tertiary)" }}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {changes.map((item) => (
          <div key={item.title} className="flex gap-2.5">
            <span
              className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: "#D84F0B" }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                {item.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
