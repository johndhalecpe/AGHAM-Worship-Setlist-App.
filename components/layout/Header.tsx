"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL } from "@/lib/type";
import { getPasswordResets, resolvePasswordReset } from "@/lib/auth";
import UserMenu from "./UserMenu";
import type { PasswordReset } from "@/lib/type";

const navLinks = [
  { href: "/setlists", label: "Lineups" },
  { href: "/songs", label: "Songs" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [showApprovals, setShowApprovals] = useState(false);
  const [pendingProfiles, setPendingProfiles] = useState<
    { id: string; name: string; role: string }[]
  >([]);
  const [passwordResets, setPasswordResets] = useState<PasswordReset[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [quickActionId, setQuickActionId] = useState<string | null>(null);
  const [resolveResetId, setResolveResetId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored !== "light";
    setIsDarkMode(dark);
    document.documentElement.classList.toggle("dark", dark);
    checkSession();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowApprovals(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    setIsAdmin(user?.email === ADMIN_EMAIL);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      if (profile) setUserName(profile.name);
    }
  }

  async function fetchPendingApprovals() {
    setLoadingApprovals(true);
    const [profilesResult, resetsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, role")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      getPasswordResets(),
    ]);
    if (!profilesResult.error && profilesResult.data) {
      setPendingProfiles(profilesResult.data);
    }
    if (resetsResult.data) {
      setPasswordResets(resetsResult.data);
    }
    setLoadingApprovals(false);
  }

  async function handleQuickAction(
    id: string,
    status: "approved" | "rejected"
  ) {
    setQuickActionId(id);
    await supabase
      .from("profiles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setPendingProfiles((prev) => prev.filter((p) => p.id !== id));
    setQuickActionId(null);
  }

  async function handleResolveReset(id: string) {
    setResolveResetId(id);
    const { error } = await resolvePasswordReset(id);
    if (!error) {
      setPasswordResets((prev) => prev.filter((r) => r.id !== id));
    }
    setResolveResetId(null);
  }

  function toggleApprovals() {
    const next = !showApprovals;
    setShowApprovals(next);
    if (next) {
      fetchPendingApprovals();
    }
  }

  function toggleDarkMode() {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function isNavLinkActive(href: string) {
    if (href === "/setlists") return pathname.startsWith("/setlists");
    if (href === "/songs") return pathname.startsWith("/songs");
    return pathname === href;
  }

  function handleLogoClick() {
    if (!userName) {
      router.push("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md bg-(--color-surface-card)/80 border-b"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <button onClick={handleLogoClick} className="inline-flex items-center cursor-pointer">
          <Image
            src="/transparent-logo.svg"
            alt="Agham Setlist"
            className="h-15 sm:h-18 w-auto mt-0.5"
            width={40}
            height={40}
          />
        </button>
        <nav className="flex items-center gap-3 sm:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors"
              style={{
                color: isNavLinkActive(link.href)
                  ? "var(--color-accent)"
                  : "var(--color-text-secondary)",
              }}
              onMouseEnter={(e) => {
                if (!isNavLinkActive(link.href))
                  (e.target as HTMLElement).style.color = "var(--color-text)";
              }}
              onMouseLeave={(e) => {
                if (!isNavLinkActive(link.href))
                  (e.target as HTMLElement).style.color =
                    "var(--color-text-secondary)";
              }}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleApprovals}
                className="relative text-sm font-medium transition-colors flex items-center gap-1.5"
                style={{
                  color: showApprovals
                    ? "var(--color-accent)"
                    : "var(--color-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!showApprovals)
                    (e.target as HTMLElement).style.color =
                      "var(--color-text)";
                }}
                onMouseLeave={(e) => {
                  if (!showApprovals)
                    (e.target as HTMLElement).style.color =
                      "var(--color-text-secondary)";
                }}
              >
                Approvals
                {(pendingProfiles.length > 0 || passwordResets.length > 0) && (
                  <span
                    className="text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                    style={{
                      backgroundColor: "var(--color-danger)",
                      color: "#fff",
                    }}
                  >
                    {pendingProfiles.length + passwordResets.length}
                  </span>
                )}
              </button>

              {showApprovals && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 top-full mt-2 w-72 sm:w-96 rounded-xl shadow-lg border overflow-hidden"
                  style={{
                    backgroundColor: "var(--color-surface-card)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <div className="p-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      Pending Approvals
                    </p>
                  </div>

                  {loadingApprovals ? (
                    <div className="p-4 text-center text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                      Loading...
                    </div>
                  ) : pendingProfiles.length === 0 && passwordResets.length === 0 ? (
                    <div className="p-4 text-center text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                      No pending items.
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {pendingProfiles.map((profile) => (
                        <div
                          key={profile.id}
                          className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0"
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          <div className="min-w-0 mr-2">
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: "var(--color-text)" }}
                            >
                              {profile.name}
                            </p>
                            <span
                              className="text-[10px] uppercase tracking-wider"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              {profile.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() =>
                                handleQuickAction(profile.id, "approved")
                              }
                              disabled={quickActionId === profile.id || resolveResetId !== null}
                              className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-50"
                              style={{
                                backgroundColor: "var(--color-success)",
                                color: "#fff",
                              }}
                            >
                              {quickActionId === profile.id ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() =>
                                handleQuickAction(profile.id, "rejected")
                              }
                              disabled={quickActionId === profile.id || resolveResetId !== null}
                              className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-50"
                              style={{
                                backgroundColor: "var(--color-danger)",
                                color: "#fff",
                              }}
                            >
                              {quickActionId === profile.id ? "..." : "Reject"}
                            </button>
                          </div>
                        </div>
                      ))}

                      {passwordResets.length > 0 && (
                        <>
                          <div
                            className="px-3 py-2 border-t border-b text-[11px] font-semibold uppercase tracking-wider"
                            style={{
                              borderColor: "var(--color-border)",
                              color: "var(--color-text-tertiary)",
                              backgroundColor: "var(--color-surface-muted)",
                            }}
                          >
                            Password Reset Requests
                          </div>
                          {passwordResets.map((reset) => (
                            <div
                              key={reset.id}
                              className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <div className="min-w-0 mr-2">
                                <p
                                  className="text-xs font-medium truncate"
                                  style={{ color: "var(--color-text)" }}
                                >
                                  {reset.email}
                                </p>
                                <span
                                  className="text-[10px]"
                                  style={{ color: "var(--color-text-tertiary)" }}
                                >
                                  New password: {reset.requested_password}
                                </span>
                              </div>
                              <button
                                onClick={() => handleResolveReset(reset.id)}
                                disabled={resolveResetId === reset.id || quickActionId !== null}
                                className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shrink-0 disabled:opacity-50"
                                style={{
                                  backgroundColor: "var(--color-accent-secondary)",
                                  color: "#fff",
                                }}
                              >
                                {resolveResetId === reset.id ? "..." : "Resolved"}
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {userName && <UserMenu userName={userName} />}
          <button
            onClick={toggleDarkMode}
            className="ml-2 p-2 rounded-lg transition-colors active:scale-95"
            style={{
              backgroundColor: "var(--color-surface-muted)",
              touchAction: "manipulation",
            }}
            aria-label="Toggle theme"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
              style={{
                color: "var(--color-text)",
                display: isDarkMode ? "block" : "none",
              }}
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
              style={{
                color: "var(--color-text)",
                display: isDarkMode ? "none" : "block",
              }}
            >
              <path
                fillRule="evenodd"
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
}
