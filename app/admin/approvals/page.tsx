"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getPendingProfiles } from "@/lib/services/profileService";
import { getPasswordResets } from "@/lib/auth";
import type { Profile, PasswordReset } from "@/lib/type";
import { ADMIN_EMAIL } from "@/lib/type";

export default function AdminApprovalsPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [passwordResets, setPasswordResets] = useState<PasswordReset[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user || user.email !== ADMIN_EMAIL) {
      router.push("/setlists");
      return;
    }

    const [pendingProfiles, pendingResets] = await Promise.all([
      getPendingProfiles(),
      getPasswordResets(),
    ]);
    setProfiles(pendingProfiles);
    setPasswordResets(pendingResets.data ?? []);
    setLoading(false);
  }

  async function handleAction(id: string, status: "approved" | "rejected") {
    setUpdatingId(id);
    const { error } = await supabase
      .from("profiles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    }
    setUpdatingId(null);
  }

  async function handleSetPassword(resetId: string, email: string) {
    const newPassword = resetPasswords[resetId];
    if (!newPassword || newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    setUpdatingId(resetId);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      toast.error("Not authenticated");
      setUpdatingId(null);
      return;
    }

    const res = await fetch("/api/admin/set-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email, newPassword, resetId }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to set password");
      setUpdatingId(null);
      return;
    }

    toast.success(`Password set for ${email}`);
    setPasswordResets((prev) => prev.filter((r) => r.id !== resetId));
    setResetPasswords((prev) => {
      const next = { ...prev };
      delete next[resetId];
      return next;
    });
    setUpdatingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p style={{ color: "var(--color-text-tertiary)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
          Pending Approvals
        </h1>
        <Link
          href="/admin/users"
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--color-accent)" }}
        >
          Active Users &rarr;
        </Link>
      </div>

      {profiles.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {profiles.map((profile) => (
            <ApprovalCard
              key={profile.id}
              profile={profile}
              onAction={handleAction}
              isUpdating={updatingId === profile.id}
            />
          ))}
        </div>
      )}

      {passwordResets.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>
            Password Reset Requests
          </h2>
          <div className="flex flex-col gap-3">
            {passwordResets.map((reset) => (
              <div
                key={reset.id}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{
                  backgroundColor: "var(--color-surface-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  {reset.email}
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter new password"
                    value={resetPasswords[reset.id] ?? ""}
                    onChange={(e) =>
                      setResetPasswords((prev) => ({
                        ...prev,
                        [reset.id]: e.target.value,
                      }))
                    }
                    className="flex-1 rounded-lg px-3 py-2 text-sm transition-colors"
                    style={{
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-text)",
                    }}
                  />
                  <button
                    onClick={() => handleSetPassword(reset.id, reset.email)}
                    disabled={
                      updatingId === reset.id ||
                      !(resetPasswords[reset.id] ?? "").trim()
                    }
                    className="rounded-lg px-4 py-2 text-sm font-medium transition-all shrink-0 whitespace-nowrap disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--color-accent-secondary)",
                      color: "white",
                    }}
                  >
                    {updatingId === reset.id ? "..." : "Set Password"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {profiles.length === 0 && passwordResets.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
          No pending items.
        </p>
      )}
    </div>
  );
}

function ApprovalCard({
  profile,
  onAction,
  isUpdating,
}: {
  profile: Profile;
  onAction: (id: string, status: "approved" | "rejected") => void;
  isUpdating: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-center justify-between gap-4"
      style={{
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
          {profile.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5"
            style={{
              backgroundColor: "var(--color-surface-muted)",
              color: "var(--color-text-secondary)",
            }}
          >
            {profile.role}
          </span>
          <span
            className="text-[11px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5"
            style={{
              backgroundColor: "var(--color-surface-muted)",
              color: "var(--color-text-secondary)",
            }}
          >
            pending
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onAction(profile.id, "approved")}
          disabled={isUpdating}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-success)",
            color: "white",
          }}
        >
          {isUpdating ? "..." : "Approve"}
        </button>
        <button
          onClick={() => onAction(profile.id, "rejected")}
          disabled={isUpdating}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-danger)",
            color: "white",
          }}
        >
          {isUpdating ? "..." : "Reject"}
        </button>
      </div>
    </div>
  );
}
