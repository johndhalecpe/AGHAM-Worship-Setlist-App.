"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { changePassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import InputField from "./InputField";
import Portal from "@/components/shared/Portal";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

export default function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) setEmail(session.user.email);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !oldPassword || !newPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("New password must be at least 4 characters");
      return;
    }

    setLoading(true);
    const { error } = await changePassword({ email, oldPassword, newPassword });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password changed successfully!");
    onClose();
  }

  return (
    <Portal>
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto"
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
          Change Password
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Changing password for: <span className="font-semibold">{email}</span>
          </p>

          <InputField
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            icon={<LockIcon />}
            value={oldPassword}
            onChange={setOldPassword}
          />

          <InputField
            label="New Password"
            type="password"
            placeholder="Enter a new password"
            icon={<LockIcon />}
            value={newPassword}
            onChange={setNewPassword}
          />

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all"
              style={{
                backgroundColor: "var(--color-surface-muted)",
                color: "var(--color-text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "#fff",
              }}
            >
              {loading ? "Changing..." : "Change"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}
