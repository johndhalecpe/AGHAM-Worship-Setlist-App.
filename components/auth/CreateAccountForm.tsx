"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signUp } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL } from "@/lib/type";
import InputField from "./InputField";

interface CreateAccountFormProps {
  onBack: () => void;
  onPending?: (name: string) => void;
}

type Role = "singer" | "musician" | "staff";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4l-10 8L2 4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function CreateAccountForm({ onBack, onPending }: CreateAccountFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("singer");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const emailError = email.length > 0 && !email.includes("@");

  const passwordError = password.length > 0 && password.length < 4;

  function handleBackToLanding() {
    setShowSuccess(false);
    onBack();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (emailError || passwordError || passwordMismatch) return;

    setLoading(true);
    const { data: signUpData, error: signUpError } = await signUp({ email, password, name, role });
    if (signUpError) {
      setLoading(false);
      toast.error(signUpError.message);
      return;
    }

    const isAdmin = email === ADMIN_EMAIL;
    const session = signUpData?.session;
    const user = session?.user ?? signUpData?.user;

    if (isAdmin && user) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "admin", status: "approved", updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (!updateError) {
        setLoading(false);
        toast.success("Admin account created!");
        router.push("/admin/approvals");
        return;
      }
    }

    setLoading(false);

    if (!session) {
      toast.success("Account created! Check your email to confirm your account.");
      return;
    }

    if (isAdmin) {
      toast.success("Admin account created!");
      router.push("/admin/approvals");
    } else {
      localStorage.setItem("pendingApprovalEmail", email);
      setShowSuccess(true);
    }
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center w-full lg:mt-3 mt-6 text-left">
        <div
          className="w-full max-w-xs rounded-2xl p-6 text-center"
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "2px solid var(--color-accent-secondary)",
          }}
        >
          <div
            className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(13, 148, 136, 0.1)" }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7"
              fill="none"
              stroke="var(--color-accent-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2
            className="text-lg font-bold mb-3"
            style={{ color: "var(--color-accent-secondary)" }}
          >
            Thank you for signing up!
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Please wait for the admin to approve your account. You&apos;ll be
            able to log in once it&apos;s done.
          </p>
          <button
            onClick={handleBackToLanding}
            className="mt-6 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 w-full"
            style={{
              backgroundColor: "var(--color-accent-secondary)",
              color: "white",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center w-full lg:mt-3 mt-6 text-left">
      <button
        type="button"
        onClick={onBack}
        className="self-start flex items-center gap-1.5 text-sm font-medium transition-opacity duration-200 hover:opacity-70"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <BackIcon />
        Back
      </button>

      <h2 className="text-2xl font-bold lg:mt-3 lg:mb-4 mt-6 mb-6 text-center">Sign Up</h2>

      <div className="flex flex-col lg:gap-2 gap-4 w-full max-w-xs">
        <InputField
          label="Full Name"
          type="text"
          placeholder="e.g. Kevs Ace"
          icon={<UserIcon />}
          value={name}
          onChange={setName}
          hint="Use your real name for easier admin approval"
        />

        <InputField
          label="Email"
          type="email"
          placeholder="your@email.com"
          icon={<MailIcon />}
          value={email}
          onChange={setEmail}
          error={emailError ? "Invalid email address" : undefined}
          clearable
          name="email"
          autoComplete="email"
        />

        <InputField
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Create a password"
          icon={<LockIcon />}
          value={password}
          onChange={setPassword}
          hint="For security, use a password you don't use anywhere else."
          error={passwordError ? "At least 4 characters" : undefined}
          clearable
          name="new-password"
          autoComplete="new-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="min-h-[32px] min-w-[32px] grid place-items-center rounded-lg transition-opacity hover:opacity-70"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />

        <InputField
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          placeholder="Re-enter your password"
          icon={<LockIcon />}
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={passwordMismatch ? "Passwords don't match" : undefined}
          clearable
          name="confirm-password"
          autoComplete="new-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="min-h-[32px] min-w-[32px] grid place-items-center rounded-lg transition-opacity hover:opacity-70"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />
      </div>

      <div className="w-full max-w-xs lg:mt-3 mt-6">
        <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text)" }}>
          I am a...
        </p>

        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <button
            type="button"
            className="flex-1 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:bg-[var(--color-surface-card)]"
            style={{
              backgroundColor: role === "singer" ? "var(--color-accent)" : "transparent",
              color: role === "singer" ? "#fff" : "var(--color-text-secondary)",
              border: role === "singer" ? "1px solid var(--color-accent)" : "1px solid transparent",
            }}
            onClick={() => setRole("singer")}
          >
            Singer
          </button>
          <button
            type="button"
            className="flex-1 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:bg-[var(--color-surface-card)]"
            style={{
              backgroundColor: role === "musician" ? "var(--color-accent)" : "transparent",
              color: role === "musician" ? "#fff" : "var(--color-text-secondary)",
              border: role === "musician" ? "1px solid var(--color-accent)" : "1px solid transparent",
            }}
            onClick={() => setRole("musician")}
          >
            Musician
          </button>
          <button
            type="button"
            className="flex-1 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:bg-[var(--color-surface-card)]"
            style={{
              backgroundColor: role === "staff" ? "var(--color-accent)" : "transparent",
              color: role === "staff" ? "#fff" : "var(--color-text-secondary)",
              border: role === "staff" ? "1px solid var(--color-accent)" : "1px solid transparent",
            }}
            onClick={() => setRole("staff")}
          >
            Staff
          </button>
        </div>

        <div
          className="lg:mt-2 mt-3 rounded-lg p-3 text-xs leading-relaxed"
          style={{
            backgroundColor: "var(--color-surface-muted)",
            color: "var(--color-text-secondary)",
          }}
        >
          {role === "singer" ? (
            <span>
              <strong style={{ color: "var(--color-accent)" }}>Singers</strong>{" "}
              can view lyrics, manage lineups, edit song details, and update lyrics in the song library.
            </span>
          ) : role === "musician" ? (
            <span>
              <strong style={{ color: "var(--color-accent)" }}>Musicians</strong>{" "}
              can view full song data — lyrics, chords, key, BPM, and time signature — as well as manage lineups and edit songs.
            </span>
          ) : (
            <span>
              <strong style={{ color: "var(--color-accent)" }}>Staffs</strong>{" "}
              are in charge of adding and completing song details in the song library.
            </span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="spotlight-btn-subtle inline-flex items-center justify-center rounded-xl w-64 px-8 py-4 text-base font-semibold lg:mt-3 mt-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent-secondary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        style={{
          border: "2px solid var(--color-accent)",
          color: "var(--color-accent)",
          backgroundColor: "transparent",
        }}
      >
        {loading ? "Creating..." : "Create Account"}
      </button>

      <p
        className="mt-6 text-[10px] leading-relaxed text-center select-none"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        Agham Setlist 0.1.3<br />
        Property of AGHAM &copy; {new Date().getFullYear()}<br />
        dev - johndhalecpe
      </p>
    </form>
  );
}
