"use client";

import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import InputField from "./InputField";
import Portal from "@/components/shared/Portal";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4l-10 8L2 4" />
    </svg>
  );
}

export default function ForgotPasswordForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isEmailValid = email.includes("@") && email.includes(".");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !isEmailValid) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("password_resets").insert({
      email,
      requested_password: null,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Request has been sent to the admin, wait for their response to you.");
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
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 grid place-items-center rounded-xl transition-colors hover:opacity-70"
          style={{ color: "var(--color-text-tertiary)" }}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold mb-6 text-center" style={{ color: "var(--color-text)" }}>
          Forgot Password
        </h2>

        <p className="text-sm mb-6 text-center" style={{ color: "var(--color-text-secondary)" }}>
          Enter your email and we&apos;ll notify the admin to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField
            label="Email"
            type="email"
            placeholder="your@email.com"
            icon={<MailIcon />}
            value={email}
            onChange={setEmail}
          />

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={loading || !email || !isEmailValid}
              className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "#fff",
              }}
            >
              {loading ? "Sending..." : "Verify"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}
