"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "@/lib/auth";
import ChangePasswordForm from "../auth/ChangePasswordForm";
import Portal from "@/components/shared/Portal";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function UserMenu({ userName }: { userName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [dropdownTop, setDropdownTop] = useState<number | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      const dropdown = document.querySelector("[data-user-menu-dropdown]");
      if (dropdown?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownTop(rect.bottom + 8);
    }
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      // signOut failed — still reset UI
    }
    setLoggingOut(false);
    setShowConfirm(false);
    setOpen(false);
    toast.success("Logged out");
    router.push("/");
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg transition-colors active:scale-95"
          style={{
            backgroundColor: "var(--color-surface-muted)",
            color: "var(--color-text)",
            touchAction: "manipulation",
          }}
          aria-label="User menu"
        >
          <UserIcon />
        </button>

        {open && dropdownTop !== null && (
          <Portal>
          <div
            data-user-menu-dropdown
            className="fixed right-4 w-56 rounded-xl shadow-lg border overflow-hidden"
            style={{
              top: dropdownTop,
              backgroundColor: "var(--color-surface-card)",
              borderColor: "var(--color-border)",
              zIndex: 200,
            }}
          >
            <div
              className="px-4 py-3 text-sm font-medium truncate border-b"
              style={{
                color: "var(--color-text)",
                borderColor: "var(--color-border)",
              }}
            >
              {userName}
            </div>

            <button
              onClick={() => { setOpen(false); setShowChangePassword(true); }}
              className="w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center gap-2"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-muted)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 018 0v4" />
              </svg>
              Change Password
            </button>

            <div className="border-t" style={{ borderColor: "var(--color-border)" }} />

            <button
              onClick={() => setShowConfirm(true)}
              className="w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center gap-2"
              style={{ color: "var(--color-danger)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-muted)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </div>
          </Portal>
        )}
      </div>

      {showConfirm && (
        <Portal>
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl my-8"
            style={{
              backgroundColor: "var(--color-surface-card)",
              border: "1px solid var(--color-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
              Log out
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all"
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-danger)",
                  color: "#fff",
                }}
              >
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {showChangePassword && (
        <ChangePasswordForm onClose={() => setShowChangePassword(false)} />
      )}
    </>
  );
}
