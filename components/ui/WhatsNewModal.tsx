"use client";

import React, { useEffect, useState } from "react";
import Portal from "@/components/shared/Portal";
import { CURRENT_VERSION, RELEASES } from "@/lib/whatsNew";
import type { WhatsNewRelease, WhatsNewUpdate } from "@/lib/whatsNew";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const STORAGE_KEY = "whatsnew-last-viewed";

export function markWhatsNewViewed() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
  } catch {}
}

export function hasUnseenUpdates(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const lastViewed = localStorage.getItem(STORAGE_KEY);
    return lastViewed !== CURRENT_VERSION;
  } catch {
    return false;
  }
}

function IconSparkles() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 0 1-1.162-.682 22.045 22.045 0 0 1-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 0 1 8-2.828A4.5 4.5 0 0 1 18 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 0 1-3.744 2.582l-.019.01-.005.003a.74.74 0 0 1-.69.001l-.005-.003z" />
    </svg>
  );
}

function IconBug() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V6h9v-.5A4.5 4.5 0 0 0 10 1Zm-4.5 7a.75.75 0 0 0-.75.75v.5c0 .256.049.5.138.72A4.483 4.483 0 0 0 4 13.5V15a1 1 0 0 0 1 1h.28a5.5 5.5 0 0 0 9.44 0H15a1 1 0 0 0 1-1v-1.5a4.483 4.483 0 0 0-1.388-3.28.75.75 0 0 0 .138-.72v-.5a.75.75 0 0 0-.75-.75h-9a.726.726 0 0 0-.25 0Z" clipRule="evenodd" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.578c.069.497.104 1.003.104 1.518 0 4.682-3.174 8.598-7.5 9.752V3.013a.5.5 0 0 0-.839-.776ZM10 17.2C14.745 15.907 18 11.734 18 7.082c0-.497-.033-.985-.1-1.464A12.947 12.947 0 0 1 10 2.9a12.947 12.947 0 0 1-7.9 2.718 12.9 12.9 0 0 0-.1 1.464C2 11.734 5.255 15.907 10 17.2Z" clipRule="evenodd" />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M3.5 10a6.5 6.5 0 0 1 11.806-3.711A5.182 5.182 0 0 0 16.5 10c0 2.43-1.118 4.5-2.5 4.5a1.5 1.5 0 0 1-1.5-1.5v-.5a3 3 0 0 0-3-3 .75.75 0 0 1 0-1.5A4.5 4.5 0 0 1 14 12.5v.5c0 .194.022.378.064.55A6.473 6.473 0 0 1 10 16.5 6.5 6.5 0 0 1 3.5 10Zm4.5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm3-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  );
}

function IconRocket() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M10 1a5 5 0 0 0-5 5c0 3.06 1.48 5.59 3.06 7.32A10.64 10.64 0 0 0 10 15.7a10.64 10.64 0 0 0 1.94-2.38C13.52 11.59 15 9.06 15 6a5 5 0 0 0-5-5Zm0 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clipRule="evenodd" />
      <path d="M5.5 14.19a8.18 8.18 0 0 0-1.78.81.5.5 0 0 0 .16.88 21.2 21.2 0 0 0 4.38.7.5.5 0 0 0 .5-.5v-1.2a9.71 9.71 0 0 1-1.56-.87 7.9 7.9 0 0 1-.7-.51c-.24.31-.54.64-.84.97a.5.5 0 0 1-.16.12v.6Z" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M19 5.5a4.5 4.5 0 0 1-4.5 4.5 4.47 4.47 0 0 1-2.13-.55l-6.2 6.2a1.5 1.5 0 0 1-2.12-2.12l6.2-6.2A4.47 4.47 0 0 1 10 5.5 4.5 4.5 0 0 1 19 5.5Zm-4.5 2.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M4 5c0-1.06 2.455-2 6-2s6 .94 6 2-2.455 2-6 2-6-.94-6-2Z" />
      <path d="M4 8.333c0 .736.867 1.417 2.292 1.877 1.498.483 3.535.79 5.708.79s4.21-.307 5.708-.79C15.133 9.75 16 9.069 16 8.333V7c0 .736-.867 1.417-2.292 1.877C12.21 9.36 10.173 9.667 8 9.667S3.79 9.36 2.292 8.877C.867 8.417 0 7.736 0 7v1.333Z" />
      <path d="M4 12c0 .736.867 1.417 2.292 1.877 1.498.483 3.535.79 5.708.79s4.21-.307 5.708-.79C15.133 12.75 16 12.069 16 11.333V10c0 .736-.867 1.417-2.292 1.877C12.21 12.36 10.173 12.667 8 12.667S3.79 12.36 2.292 11.877C.867 11.417 0 10.736 0 10v1.333Z" />
      <path d="M4 14.667c0 .736.867 1.417 2.292 1.877 1.498.483 3.535.79 5.708.79s4.21-.307 5.708-.79C15.133 16.084 16 15.403 16 14.667V14c0 .736-.867 1.417-2.292 1.877-1.498.483-3.535.79-5.708.79s-4.21-.307-5.708-.79C.867 15.417 0 14.736 0 14v.667Z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path fillRule="evenodd" d="M10 1a9 9 0 0 0-2.967.551.75.75 0 0 0-.565.866l.255 1.023a7.523 7.523 0 0 0-1.564 1.03l-.98-.354a.75.75 0 0 0-.93.398A8.979 8.979 0 0 0 2.106 7.22a.75.75 0 0 0 .256.967l.88.587a7.528 7.528 0 0 0 0 2.452l-.88.587a.75.75 0 0 0-.256.967 8.98 8.98 0 0 0 1.143 2.007.75.75 0 0 0 .93.398l.98-.354c.478.42 1.002.772 1.564 1.03l-.255 1.023a.75.75 0 0 0 .565.866A8.979 8.979 0 0 0 10 19c.997 0 1.957-.162 2.857-.46a.75.75 0 0 0 .594-.876l-.281-1.124a7.524 7.524 0 0 0 1.553-1.002l1.037.414a.75.75 0 0 0 .931-.361 8.98 8.98 0 0 0 1.17-2.112.75.75 0 0 0-.281-.947l-.922-.623a7.528 7.528 0 0 0 0-2.452l.922-.623a.75.75 0 0 0 .28-.947 8.979 8.979 0 0 0-1.17-2.112.75.75 0 0 0-.93-.36l-1.037.413a7.524 7.524 0 0 0-1.554-1.002l.282-1.124a.75.75 0 0 0-.594-.876A9.002 9.002 0 0 0 10 1Zm3 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" clipRule="evenodd" />
    </svg>
  );
}

const ICON_MAP: Record<string, () => React.ReactNode> = {
  sparkles: IconSparkles,
  bug: IconBug,
  shield: IconShield,
  palette: IconPalette,
  rocket: IconRocket,
  wrench: IconWrench,
  database: IconDatabase,
  settings: IconSettings,
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  New: { bg: "var(--color-accent)", text: "#fff" },
  Improvement: { bg: "var(--color-accent-secondary)", text: "#fff" },
  "Bug Fix": { bg: "#DC2626", text: "#fff" },
  Performance: { bg: "#7C3AED", text: "#fff" },
  Security: { bg: "#059669", text: "#fff" },
  UI: { bg: "#0284C7", text: "#fff" },
  Backend: { bg: "#D97706", text: "#fff" },
  "Breaking Change": { bg: "#DC2626", text: "#fff" },
};

function FeatureIcon({ icon }: { icon: string }) {
  const IconComponent = ICON_MAP[icon];
  if (!IconComponent) return null;
  return (
    <div
      className="rounded-lg flex items-center justify-center shrink-0"
      style={{
        width: 32,
        height: 32,
        backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
        color: "var(--color-accent)",
      }}
    >
      <IconComponent />
    </div>
  );
}

function CategoryBadge({ label }: { label: string }) {
  const style = CATEGORY_STYLES[label] ?? { bg: "var(--color-surface-muted)", text: "var(--color-text-secondary)" };
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {label}
    </span>
  );
}

function FeatureCard({ update, index }: { update: WhatsNewUpdate; index: number }) {
  return (
    <div
      className="flex gap-3 animate-fade-in"
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "backwards",
        animationDuration: "0.35s",
      }}
    >
      <FeatureIcon icon={update.icon} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1 mb-1">
          {update.category.map((cat) => (
            <CategoryBadge key={cat} label={cat} />
          ))}
        </div>
        <h4
          className="text-sm font-semibold leading-snug mb-0.5"
          style={{ color: "var(--color-text)" }}
        >
          {update.title}
        </h4>
        <p
          className="text-xs leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {update.description}
        </p>
        {update.link && (
          <a
            href={update.link}
            className="inline-block mt-1 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--color-accent)" }}
          >
            Learn More &rarr;
          </a>
        )}
      </div>
    </div>
  );
}

function VersionSection({
  release,
  showPreviousLabel,
}: {
  release: WhatsNewRelease;
  showPreviousLabel: boolean;
}) {
  return (
    <div>
      {showPreviousLabel && (
        <div className="mb-4">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Previous Updates
          </p>
        </div>
      )}

      <div className="flex items-baseline gap-2 mb-3">
        <div className="flex items-center gap-2">
          {release.latest ? (
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--color-accent-secondary)" }}
            >
              Latest Release
            </span>
          ) : (
            <span
              className="text-[10px] font-semibold"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              v{release.version}
            </span>
          )}
        </div>
        {release.latest && (
          <>
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none"
              style={{
                backgroundColor: "var(--color-accent-secondary)",
                color: "#fff",
              }}
            >
              v{release.version}
            </span>
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                color: "var(--color-accent)",
              }}
            >
              Newest
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col">
        {release.updates.map((update, i) => (
          <div key={i}>
            {i > 0 && (
              <div
                className="my-3 ml-0"
                style={{
                  height: 1,
                  backgroundColor: "var(--color-border)",
                  opacity: 0.5,
                }}
              />
            )}
            <FeatureCard update={update} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WhatsNewModal({ isOpen, onClose }: Props) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const raf = requestAnimationFrame(() => {
        setShouldRender(true);
        requestAnimationFrame(() => setIsEntered(true));
      });
      return () => {
        document.body.style.overflow = "";
        cancelAnimationFrame(raf);
      };
    } else {
      setIsEntered(false); // eslint-disable-line react-hooks/set-state-in-effect
      const timer = setTimeout(() => setShouldRender(false), 250);
      return () => {
        document.body.style.overflow = "";
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        markWhatsNewViewed();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const olderReleases = RELEASES.filter((r) => !r.latest);
  const latestRelease = RELEASES.find((r) => r.latest);
  const hasOlder = olderReleases.length > 0;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style={{
          backgroundColor: isEntered ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
          transition: "background-color 0.2s ease-out",
        }}
        onClick={() => {
          markWhatsNewViewed();
          onClose();
        }}
      >
        <div
          className="relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col"
          style={{
            maxHeight: "min(80dvh, 640px)",
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border)",
            opacity: isEntered ? 1 : 0,
            transform: isEntered ? "scale(1) translateY(0)" : "scale(0.96) translateY(10px)",
            transition: "opacity 0.2s ease-out, transform 0.25s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="shrink-0 px-6 pt-6 pb-4"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h1
                  className="text-xl font-bold leading-tight"
                  style={{ color: "var(--color-text)" }}
                >
                  What&rsquo;s New
                </h1>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Latest updates and improvements
                </p>
              </div>
            </div>
          </div>

          <div
            className="overflow-y-auto flex-1 px-6 py-4"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "var(--color-border) transparent",
            }}
          >
            <div className="flex flex-col gap-8">
              {latestRelease && (
                <VersionSection
                  release={latestRelease}
                  showPreviousLabel={false}
                />
              )}

              {hasOlder && (
                <div className="flex flex-col gap-8">
                  {olderReleases.map((release, i) => (
                    <VersionSection
                      key={release.version}
                      release={release}
                      showPreviousLabel={i === 0}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className="shrink-0 flex items-center justify-end px-6 py-4"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <button
              onClick={() => {
                markWhatsNewViewed();
                onClose();
              }}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "#fff",
                minHeight: "40px",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
