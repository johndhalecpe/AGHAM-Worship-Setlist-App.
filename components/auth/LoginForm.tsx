"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL } from "@/lib/type";
import InputField from "./InputField";
import ForgotPasswordForm from "./ForgotPasswordForm";

interface LoginFormProps {
  onBack: () => void;
  onRejected?: (name: string) => void;
  onPending?: (name: string) => void;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
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

export default function LoginForm({ onBack, onRejected, onPending }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const emailError = email.length > 0 && !email.includes("@");

  const passwordError = password.length > 0 && password.length < 4;

  async function handleSubmit(e: React.FormEvent) {
    if (showForgotPassword) return;
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (emailError || passwordError) return;

    setLoading(true);
    const { data: signInData, error: signInError } = await signIn({ email, password });
    if (signInError) {
      setLoading(false);
      toast.error(signInError.message);
      return;
    }

    const user = signInData?.user;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("status, name, role")
        .eq("id", user.id)
        .single();

      if (profile?.status === "rejected") {
        localStorage.removeItem("pendingApprovalEmail");
        await supabase.auth.signOut();
        setLoading(false);
        onRejected?.(profile.name);
        return;
      }

      if (profile?.status === "pending") {
        if (user.email === ADMIN_EMAIL) {
          await supabase
            .from("profiles")
            .update({ role: "admin", status: "approved", updated_at: new Date().toISOString() })
            .eq("id", user.id);
        } else {
          await supabase.auth.signOut();
          setLoading(false);
          onPending?.(profile.name);
          return;
        }
      }

      if (user.email === ADMIN_EMAIL && profile?.role !== "admin") {
        await supabase
          .from("profiles")
          .update({ role: "admin", status: "approved", updated_at: new Date().toISOString() })
          .eq("id", user.id);
      }
    }

    setLoading(false);

    const pendingEmail = localStorage.getItem("pendingApprovalEmail");
    if (pendingEmail === user?.email) {
      localStorage.removeItem("pendingApprovalEmail");
      toast.success("Your account has been approved! You can now log in.");
    } else {
      toast.success("Welcome back!");
    }

    router.push("/setlists");
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="on" method="POST" action="#" className="flex flex-col items-center w-full lg:mt-3 mt-6 text-left">
      <button
        type="button"
        onClick={onBack}
        className="self-start flex items-center gap-1.5 text-sm font-medium transition-opacity duration-200 hover:opacity-70"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <BackIcon />
        Back
      </button>

      <div className="w-full max-w-xs mt-6 lg:mt-4">
        <p className="pl-1">
          <span className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            Welcome back!
          </span>
          <br />
          <span
            className="text-base leading-relaxed font-semibold"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Sign in to manage and view lineups details.
          </span>
        </p>
      </div>

      <h2 className="text-2xl font-bold lg:mt-3 lg:mb-4 mt-4 mb-6 text-center">Login</h2>

      <div className="flex flex-col lg:gap-2 gap-4 w-full max-w-xs">
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
          id="login-email"
          autoComplete="email"
        />

        <InputField
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          icon={<LockIcon />}
          value={password}
          onChange={setPassword}
          error={passwordError ? "At least 4 characters" : undefined}
          clearable
          name="password"
          id="login-password"
          autoComplete="current-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] grid place-items-center rounded-lg transition-opacity hover:opacity-70"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />
      </div>

      <button
        type="button"
        onClick={() => setShowForgotPassword(true)}
        className="text-xs font-medium mt-2 transition-opacity duration-200 hover:opacity-70"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        Forgot password?
      </button>

      {showForgotPassword && (
        <ForgotPasswordForm onClose={() => setShowForgotPassword(false)} />
      )}

      <button
        type="submit"
        disabled={loading}
        className="spotlight-btn inline-flex items-center justify-center rounded-xl w-64 px-8 py-4 text-base font-semibold lg:mt-3 mt-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        style={{
          background: "linear-gradient(135deg, var(--color-accent), #e8632a)",
          color: "#fff",
        }}
      >
        {loading ? "Signing in..." : "Log In"}
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
