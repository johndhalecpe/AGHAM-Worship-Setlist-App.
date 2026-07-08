"use client";

import { useEffect } from "react";
import Portal from "@/components/shared/Portal";

type StatusType = "rejected" | "pending";

export type StatusInfo = {
  type: StatusType;
  name: string;
} | null;

export default function StatusBanner({
  statusInfo,
  onDismiss,
}: {
  statusInfo: StatusInfo;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (statusInfo) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [statusInfo]);

  if (!statusInfo) return null;

  const isRejected = statusInfo.type === "rejected";

  return (
    <Portal>
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onDismiss}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl my-8"
        style={{
          backgroundColor: "var(--color-surface-card)",
          border: isRejected
            ? "2px solid var(--color-danger)"
            : "2px solid var(--color-accent-secondary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isRejected ? (
          <div
            className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(220, 38, 38, 0.1)" }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8"
              fill="none"
              stroke="var(--color-danger)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        ) : (
          <div
            className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(13, 148, 136, 0.1)" }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8"
              fill="none"
              stroke="var(--color-accent-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
        )}

        <h2
          className="text-xl font-bold mb-2"
          style={{
            color: isRejected ? "var(--color-danger)" : "var(--color-accent-secondary)",
          }}
        >
          {isRejected ? "Account Rejected" : "Account Pending"}
        </h2>

        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {isRejected ? (
            <>
              Your account has been rejected. Please contact the admin{" "}
              <span className="font-semibold" style={{ color: "var(--color-accent)" }}>
                (johndhalecpe@setlist.com)
              </span>{" "}
              if you believe this is a mistake.
            </>
          ) : (
            <>
              Your account is awaiting admin approval. You&apos;ll be notified once
              your account has been reviewed.
            </>
          )}
        </p>

        <button
          onClick={onDismiss}
          className="mt-6 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 w-full"
          style={{
            backgroundColor: isRejected
              ? "var(--color-danger)"
              : "var(--color-accent-secondary)",
            color: "white",
          }}
        >
          I Understand
        </button>
      </div>
    </div>
    </Portal>
  );
}
