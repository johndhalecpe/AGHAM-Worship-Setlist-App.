"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL } from "@/lib/type";
import { getPasswordResets, signOut } from "@/lib/auth";
import UserMenu from "./UserMenu";
import ChangePasswordForm from "../auth/ChangePasswordForm";
import Portal from "@/components/shared/Portal";
import { useNewUserNotification } from "@/lib/hooks/useNewUserNotification";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileUserActions, setShowMobileUserActions] = useState(false);
  const [showMobileChangePassword, setShowMobileChangePassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [showMobileApprovals, setShowMobileApprovals] = useState(false);
  const [showMobileUsers, setShowMobileUsers] = useState(false);
  const [activeUsers, setActiveUsers] = useState<{ user_id: string; email: string; name: string }[]>([]);
  const [loadingActiveUsers, setLoadingActiveUsers] = useState(false);
  const [pendingProfiles, setPendingProfiles] = useState<
    { id: string; name: string; role: string }[]
  >([]);
  const [passwordResets, setPasswordResets] = useState<PasswordReset[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [quickActionId, setQuickActionId] = useState<string | null>(null);
  const [resolveResetId, setResolveResetId] = useState<string | null>(null);
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useNewUserNotification(isAdmin);

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

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showMobileMenu]);

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

  async function fetchActiveUsers() {
    setLoadingActiveUsers(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      const res = await fetch("/api/admin/active-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setActiveUsers(json.users);
      }
    }
    setLoadingActiveUsers(false);
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

  async function handleSetPassword(resetId: string, email: string) {
    const newPassword = resetPasswords[resetId];
    if (!newPassword || newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    setResolveResetId(resetId);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      toast.error("Not authenticated");
      setResolveResetId(null);
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
      setResolveResetId(null);
      return;
    }

    toast.success(`Password set for ${email}`);
    setPasswordResets((prev) => prev.filter((r) => r.id !== resetId));
    setResetPasswords((prev) => {
      const next = { ...prev };
      delete next[resetId];
      return next;
    });
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

  async function handleMobileLogout() {
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      // signOut failed — still reset UI
    }
    setLoggingOut(false);
    setShowMobileMenu(false);
    setShowMobileUserActions(false);
    toast.success("Logged out");
    router.push("/");
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMobileMenu(true)}
            className="lg:hidden p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </button>
          <button onClick={handleLogoClick} className="inline-flex items-center cursor-pointer">
            <Image
              src="/transparent-logo.svg"
              alt="Agham Setlist"
              className="h-15 sm:h-18 w-auto mt-0.5"
              width={40}
              height={40}
            />
          </button>
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-3 sm:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors min-h-[44px] flex items-center"
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
                className="relative text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[44px]"
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
                    className="text-[10px] font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1"
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
                  className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-xl shadow-lg border overflow-hidden"
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
                              className="flex flex-col px-3 py-2.5 border-b last:border-b-0 gap-2"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <p
                                className="text-xs font-medium"
                                style={{ color: "var(--color-text)" }}
                              >
                                {reset.email}
                              </p>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="New password"
                                  value={resetPasswords[reset.id] ?? ""}
                                  onChange={(e) =>
                                    setResetPasswords((prev) => ({
                                      ...prev,
                                      [reset.id]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 rounded-lg px-2.5 py-1.5 text-[11px] transition-colors"
                                  style={{
                                    border: "1px solid var(--color-border)",
                                    backgroundColor: "var(--color-surface)",
                                    color: "var(--color-text)",
                                  }}
                                />
                                <button
                                  onClick={() => handleSetPassword(reset.id, reset.email)}
                                  disabled={
                                    resolveResetId === reset.id ||
                                    quickActionId !== null ||
                                    !(resetPasswords[reset.id] ?? "").trim()
                                  }
                                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shrink-0 whitespace-nowrap disabled:opacity-50"
                                  style={{
                                    backgroundColor: "var(--color-accent-secondary)",
                                    color: "#fff",
                                  }}
                                >
                                  {resolveResetId === reset.id ? "..." : "Set Password"}
                                </button>
                              </div>
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
          {isAdmin && (
            <Link
              href="/admin/users"
              className="text-sm font-medium transition-colors min-h-[44px] flex items-center"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--color-text)"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--color-text-secondary)"; }}
            >
              Users
            </Link>
          )}
          {userName && <UserMenu userName={userName} />}
          <button
            onClick={toggleDarkMode}
            className="ml-2 p-2 rounded-lg transition-colors active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
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

        {/* Mobile theme toggle - visible only on small screens */}
        <button
          onClick={toggleDarkMode}
          className="lg:hidden p-2 rounded-lg transition-colors active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
      </div>

      {/* Mobile drawer */}
      {showMobileMenu && (
        <Portal>
        <div
          className="fixed inset-0 z-[200] lg:hidden"
          onClick={() => setShowMobileMenu(false)}
        >
          <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 max-w-[calc(100vw-3rem)] shadow-2xl overflow-y-auto"
            style={{
              backgroundColor: "var(--color-surface-card)",
              borderRight: "1px solid var(--color-border)",
              animation: "slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showMobileApprovals ? (
              <div className="flex flex-col min-h-full">
                <div className="px-4 pt-5 pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowMobileApprovals(false)}
                      className="rounded-lg p-2 transition-colors hover:bg-(--color-surface-muted) min-h-[44px] min-w-[44px] flex items-center justify-center"
                      style={{ color: "var(--color-text-secondary)" }}
                      aria-label="Back to menu"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="rounded-lg p-2 transition-colors hover:bg-(--color-surface-muted) min-h-[44px] min-w-[44px] flex items-center justify-center"
                      style={{ color: "var(--color-text-secondary)" }}
                      aria-label="Close menu"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <h2 className="font-bold text-base mt-3" style={{ color: "var(--color-text)" }}>Pending Approvals</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>Review new sign-ups and requests</p>
                </div>

                {loadingApprovals ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Loading...</span>
                    </div>
                  </div>
                ) : pendingProfiles.length === 0 && passwordResets.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <svg viewBox="0 0 24 24" className="w-10 h-10 mb-3" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>All caught up!<br />No pending items.</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {pendingProfiles.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0" style={{ borderColor: "var(--color-border)" }}>
                        <div className="min-w-0 mr-2">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>{profile.name}</p>
                          <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--color-accent-secondary)" }}>{profile.role}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleQuickAction(profile.id, "approved")}
                            disabled={quickActionId === profile.id || resolveResetId !== null}
                            className="rounded-lg px-3 py-2 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50"
                            style={{ backgroundColor: "var(--color-success)", color: "#fff" }}
                          >
                            {quickActionId === profile.id ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleQuickAction(profile.id, "rejected")}
                            disabled={quickActionId === profile.id || resolveResetId !== null}
                            className="rounded-lg px-3 py-2 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50"
                            style={{ backgroundColor: "var(--color-danger)", color: "#fff" }}
                          >
                            {quickActionId === profile.id ? "..." : "Reject"}
                          </button>
                        </div>
                      </div>
                    ))}

                    {passwordResets.length > 0 && (
                      <>
                        <div
                          className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: "var(--color-text-tertiary)", backgroundColor: "var(--color-surface-muted)" }}
                        >
                          Password Reset Requests
                        </div>
                        {passwordResets.map((reset) => (
                          <div key={reset.id} className="flex flex-col px-4 py-3 border-b last:border-b-0 gap-2" style={{ borderColor: "var(--color-border)" }}>
                            <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{reset.email}</p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <input
                                type="text"
                                placeholder="New password"
                                value={resetPasswords[reset.id] ?? ""}
                                onChange={(e) =>
                                  setResetPasswords((prev) => ({
                                    ...prev,
                                    [reset.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 rounded-lg px-3 py-2 text-[13px] transition-colors"
                                style={{
                                  border: "1px solid var(--color-border)",
                                  backgroundColor: "var(--color-surface)",
                                  color: "var(--color-text)",
                                }}
                              />
                              <button
                                onClick={() => handleSetPassword(reset.id, reset.email)}
                                disabled={
                                  resolveResetId === reset.id ||
                                  quickActionId !== null ||
                                  !(resetPasswords[reset.id] ?? "").trim()
                                }
                                className="rounded-lg px-4 py-2 text-[11px] font-semibold shrink-0 whitespace-nowrap transition-all active:scale-95 disabled:opacity-50"
                                style={{ backgroundColor: "var(--color-accent-secondary)", color: "#fff" }}
                              >
                                {resolveResetId === reset.id ? "..." : "Set Password"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : showMobileUsers ? (
            <div className="flex flex-col min-h-full">
              <div className="px-4 pt-5 pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowMobileUsers(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-(--color-surface-muted) min-h-[44px] min-w-[44px] flex items-center justify-center"
                    style={{ color: "var(--color-text-secondary)" }}
                    aria-label="Back to menu"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-(--color-surface-muted) min-h-[44px] min-w-[44px] flex items-center justify-center"
                    style={{ color: "var(--color-text-secondary)" }}
                    aria-label="Close menu"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <h2 className="font-bold text-base mt-3" style={{ color: "var(--color-text)" }}>Active Users</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>Users with an active session right now.</p>
              </div>

              {loadingActiveUsers ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Loading...</span>
                  </div>
                </div>
              ) : activeUsers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>No active users at the moment.</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {activeUsers.map((u) => (
                    <div key={u.user_id} className="px-4 py-3 border-b last:border-b-0" style={{ borderColor: "var(--color-border)" }}>
                      <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{u.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            ) : (
            <div className="flex flex-col min-h-full">
              <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base" style={{ color: "var(--color-text)" }}>Menu</h2>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="rounded-lg p-2 transition-colors hover:bg-(--color-surface-muted) min-h-[44px] min-w-[44px] flex items-center justify-center"
                    style={{ color: "var(--color-text-secondary)" }}
                    aria-label="Close menu"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {userName && (
                  <div className="flex items-center gap-3 mt-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                        color: "var(--color-accent)",
                      }}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--color-text)" }}>{userName}</p>
                      <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>Signed in</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 p-3 flex flex-col gap-0.5">
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-tertiary)" }}>
                  Navigation
                </p>
                {navLinks.map((link) => {
                  const icon = link.href.startsWith("/setlists") ? (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" />
                      <path d="M9 14l2 2 4-4" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  );
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setShowMobileMenu(false)}
                      className="rounded-xl px-4 py-3 text-sm font-medium transition-all min-h-[44px] flex items-center gap-3 active:scale-[0.98]"
                      style={{
                        color: isNavLinkActive(link.href)
                          ? "var(--color-accent)"
                          : "var(--color-text-secondary)",
                        backgroundColor: isNavLinkActive(link.href)
                          ? "color-mix(in srgb, var(--color-accent) 8%, transparent)"
                          : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isNavLinkActive(link.href))
                          (e.currentTarget as HTMLElement).style.backgroundColor = "color-mix(in srgb, var(--color-accent) 5%, transparent)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isNavLinkActive(link.href))
                          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                    >
                      {icon}
                      {link.label}
                    </Link>
                  );
                })}

                {isAdmin && (
                  <>
                    <p className="px-4 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-tertiary)" }}>
                      Admin
                    </p>
                    <button
                      onClick={() => {
                        setShowMobileApprovals(true);
                        fetchPendingApprovals();
                      }}
                      className="rounded-xl px-4 py-3 text-sm font-medium transition-all text-left min-h-[44px] flex items-center gap-3 active:scale-[0.98]"
                      style={{ color: "var(--color-text-secondary)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "color-mix(in srgb, var(--color-accent) 5%, transparent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Approvals
                      {(pendingProfiles.length > 0 || passwordResets.length > 0) && (
                        <span
                          className="text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5"
                          style={{ backgroundColor: "var(--color-danger)", color: "#fff" }}
                        >
                          {pendingProfiles.length + passwordResets.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowMobileUsers(true);
                        fetchActiveUsers();
                      }}
                      className="rounded-xl px-4 py-3 text-sm font-medium transition-all text-left min-h-[44px] flex items-center gap-3 active:scale-[0.98]"
                      style={{ color: "var(--color-text-secondary)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "color-mix(in srgb, var(--color-accent) 5%, transparent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      Users
                    </button>
                  </>
                )}
              </div>

              {userName && (
                <div className="border-t p-3" style={{ borderColor: "var(--color-border)" }}>
                  <button
                    onClick={() => setShowMobileUserActions(!showMobileUserActions)}
                    className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-all text-left min-h-[44px] flex items-center justify-between active:scale-[0.98]"
                    style={{
                      color: "var(--color-text)",
                      backgroundColor: showMobileUserActions
                        ? "color-mix(in srgb, var(--color-accent) 5%, transparent)"
                        : "transparent",
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                      </svg>
                      Settings
                    </span>
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`w-4 h-4 transition-transform duration-200 ${showMobileUserActions ? "rotate-180" : ""}`}
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {showMobileUserActions && (
                    <div className="flex flex-col gap-0.5 px-2 pt-1 pb-1">
                      <button
                        onClick={() => setShowMobileChangePassword(true)}
                        className="rounded-xl px-4 py-3 text-sm font-medium transition-all text-left min-h-[44px] flex items-center gap-3 active:scale-[0.98]"
                        style={{ color: "var(--color-text-secondary)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "color-mix(in srgb, var(--color-accent) 5%, transparent)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V7a4 4 0 018 0v4" />
                        </svg>
                        Change Password
                      </button>
                      <button
                        onClick={handleMobileLogout}
                        disabled={loggingOut}
                        className="rounded-xl px-4 py-3 text-sm font-medium transition-all text-left min-h-[44px] flex items-center gap-3 active:scale-[0.98] disabled:opacity-50"
                        style={{ color: "var(--color-danger)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "color-mix(in srgb, var(--color-danger) 8%, transparent)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        {loggingOut ? "Logging out..." : "Log out"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </div>
        </div>
        </Portal>
      )}

      {showMobileChangePassword && (
        <ChangePasswordForm onClose={() => setShowMobileChangePassword(false)} />
      )}
    </header>
  );
}
