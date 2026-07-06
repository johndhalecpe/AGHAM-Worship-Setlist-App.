"use client";

import { useState, useEffect, useCallback } from "react";
import { CURRENT_VERSION, CHANGELOG, type ChangelogEntry } from "@/lib/whatsNew";

const LS_KEY = "agham-last-seen-version";

type WhatsNewModalProps = {
  entries?: ChangelogEntry[];
  version?: string;
};

export default function WhatsNewModal({
  entries = CHANGELOG,
  version = CURRENT_VERSION,
}: WhatsNewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  const markSeen = useCallback(() => {
    try { localStorage.setItem(LS_KEY, version); } catch { /* noop */ }
  }, [version]);

  useEffect(() => {
    let lastSeen: string | null = null;
    try { lastSeen = localStorage.getItem(LS_KEY); } catch { /* noop */ }
    if (!lastSeen || lastSeen !== version) {
      setHasNew(true);
      if (lastSeen) setIsOpen(true);
    }
  }, [version]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        markSeen();
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, markSeen]);

  function handleDismiss() {
    markSeen();
    setHasNew(false);
    setIsOpen(false);
  }

  function handleOpen() {
    setIsOpen(true);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed top-4 right-4 z-40 inline-flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border)",
          width: "44px",
          height: "44px",
          color: "var(--color-text-secondary)",
        }}
        title="What's New"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 0 1-1.162-.682 22.045 22.045 0 0 1-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 0 1 8-2.828A4.5 4.5 0 0 1 18 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 0 1-3.744 2.582l-.019.01-.005.003a.74.74 0 0 1-.69.001l-.005-.003zm0 0l.005-.003-.005.003zm0 0l-.005-.003.005.003z"
            clipRule="evenodd"
          />
        </svg>
        {hasNew && (
          <span
            className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--color-accent)" }}
          />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          onClick={handleDismiss}
        >
          <div
            className="absolute inset-y-0 right-0 w-full sm:w-96 flex flex-col animate-slide-in-right"
            style={{
              backgroundColor: "var(--color-surface-card)",
              borderLeft: "1px solid var(--color-border)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center gap-2.5">
                <h2
                  className="text-sm font-bold"
                  style={{ color: "var(--color-text)" }}
                >
                  What&rsquo;s New
                </h2>
                <span
                  className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none"
                  style={{
                    backgroundColor: "var(--color-accent-secondary)",
                    color: "#fff",
                  }}
                >
                  v{version}
                </span>
              </div>
              <button
                onClick={handleDismiss}
                className="rounded-lg p-1.5 transition-colors hover:opacity-80"
                style={{ color: "var(--color-text-tertiary)" }}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto px-5 py-4"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "var(--color-border) transparent",
              }}
            >
              <div className="flex flex-col gap-6">
                {entries.map((entry) => (
                  <div key={entry.version}>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span
                        className="text-xs font-bold"
                        style={{ color: "var(--color-text)" }}
                      >
                        v{entry.version}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {entry.date}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {entry.groups.map((group) => (
                        <div key={group.type}>
                          <span
                            className="inline-block text-[10px] font-bold uppercase tracking-wider mb-1.5"
                            style={{ color: "var(--color-accent-secondary)" }}
                          >
                            {group.type}
                          </span>
                          <ul className="flex flex-col gap-1 list-disc pl-4">
                            {group.items.map((item, i) => (
                              <li
                                key={i}
                                className="text-xs leading-relaxed"
                                style={{ color: "var(--color-text-secondary)" }}
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="flex items-center justify-end px-5 py-3 shrink-0"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <button
                onClick={handleDismiss}
                className="rounded-lg px-4 py-2 text-xs font-semibold transition-colors hover:opacity-90"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "#fff",
                  minHeight: "36px",
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
