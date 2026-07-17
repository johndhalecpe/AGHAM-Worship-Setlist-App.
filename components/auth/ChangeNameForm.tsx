"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateProfileName } from "@/lib/services/profileService";
import Portal from "@/components/shared/Portal";

export default function ChangeNameForm({
  currentName,
  onClose,
  onNameUpdated,
}: {
  currentName: string;
  onClose: () => void;
  onNameUpdated: (newName: string) => void;
}) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const hasChanges = name.trim() !== currentName && name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (!hasChanges) {
      toast.error("No changes to save");
      return;
    }

    setLoading(true);
    const { error } = await updateProfileName(name.trim());
    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Name changed successfully!");
    onNameUpdated(name.trim());
    onClose();
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[300] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-sm rounded-2xl p-8 shadow-2xl my-8"
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-6 text-center" style={{ color: "var(--color-text)" }}>
            Change Name
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                className="text-sm font-medium mb-1.5 block"
                style={{ color: "var(--color-text)" }}
              >
                New Name
              </label>
              <input
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                autoCapitalize="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={currentName}
                className="w-full rounded-xl px-4 py-3 text-sm transition-colors"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                autoFocus
              />
            </div>

            {hasChanges && (
              <p
                className="text-xs leading-relaxed px-3 py-2 rounded-lg"
                style={{
                  color: "var(--color-text-secondary)",
                  backgroundColor: "var(--color-surface-muted)",
                }}
              >
                Do you wanna change your name from{" "}
                <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                  &ldquo;{currentName}&rdquo;
                </span>{" "}
                to{" "}
                <span className="font-semibold" style={{ color: "var(--color-accent)" }}>
                  &ldquo;{name.trim()}&rdquo;
                </span>
                ?
              </p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all min-h-[44px]"
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !hasChanges}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 min-h-[44px]"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "#fff",
                }}
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
