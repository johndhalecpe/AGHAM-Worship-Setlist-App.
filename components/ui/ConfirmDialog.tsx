"use client";

import { useEffect } from "react";

type ConfirmDialogProps = {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  confirmLabel?: string;
};

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmLabel = "Delete",
}: ConfirmDialogProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="rounded-xl p-6 max-w-sm w-full"
        style={{
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <h3
          className="text-lg font-bold mb-2"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </h3>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {message}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#DC2626", color: "#fff" }}
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
