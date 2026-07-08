"use client";

import Link from "next/link";
import LoginForm from "./LoginForm";
import CreateAccountForm from "./CreateAccountForm";

function ArrowIcon() {
  return (
    <svg
      className="ml-2 h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export type AuthView = "landing" | "login" | "create-account";

interface AuthCardProps {
  view: AuthView;
  onGoToLogin: () => void;
  onGoToCreateAccount: () => void;
  onGoToLanding: () => void;
  direction: "forward" | "back";
  onRejected?: (name: string) => void;
  onPending?: (name: string) => void;
}

export default function AuthCard({ view, onGoToLogin, onGoToCreateAccount, onGoToLanding, direction, onRejected, onPending }: AuthCardProps) {
  const animClass = direction === "forward" ? "animate-grow-in" : "animate-fade-in";

  return (
    <div key={view} className={`${animClass} lg:mt-3 mt-10`}>
      {view === "login" ? (
        <LoginForm onBack={onGoToLanding} onRejected={onRejected} onPending={onPending} />
      ) : view === "create-account" ? (
        <CreateAccountForm onBack={onGoToLanding} onPending={onPending} />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onGoToLogin}
            className="spotlight-btn inline-flex items-center justify-center rounded-xl w-64 px-8 py-4 text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent)]"
            style={{
              background: "linear-gradient(135deg, var(--color-accent), #e8632a)",
              color: "#fff",
            }}
          >
            Log In
          </button>

          <button
            onClick={onGoToCreateAccount}
            className="spotlight-btn-subtle inline-flex items-center justify-center rounded-xl w-64 px-8 py-4 text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent-secondary)]"
            style={{
              border: "2px solid var(--color-accent)",
              color: "var(--color-accent)",
              backgroundColor: "transparent",
            }}
          >
            Sign Up
          </button>

          <Link
            href="/setlists"
            className="group inline-flex items-center justify-center rounded-xl w-64 px-8 py-4 text-base font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-border)]"
            style={{
              backgroundColor: "var(--color-surface-muted)",
              color: "var(--color-text-secondary)",
            }}
          >
            Continue as Guest
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              <ArrowIcon />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
