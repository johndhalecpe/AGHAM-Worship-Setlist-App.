"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import AuthCard, { type AuthView } from "@/components/auth/AuthCard";
import StatusBanner, { type StatusInfo } from "@/components/ui/StatusBanner";


function HomePageSkeleton() {
  return (
    <div className="opacity-15 dark:opacity-10 pointer-events-none select-none">
      <div
        className="h-14 border-b"
        style={{ borderColor: "var(--color-border)" }}
      />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div
            className="h-7 w-44 rounded"
            style={{ backgroundColor: "var(--color-text-tertiary)" }}
          />
          <div
            className="h-9 w-32 rounded-lg"
            style={{ backgroundColor: "var(--color-gold-500)" }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl"
              style={{ backgroundColor: "var(--color-surface-card)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>("landing");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [statusInfo, setStatusInfo] = useState<StatusInfo>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/setlists");
      } else {
        setCheckingSession(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (statusInfo?.type === "rejected") {
      const timer = setTimeout(() => {
        toast.error("Your account has been rejected. Please contact the admin.", {
          duration: 8000,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [statusInfo]);

  function goToLogin() {
    setDirection("forward");
    setView("login");
  }

  function goToLanding() {
    setDirection("back");
    setView("landing");
  }

  function goToCreateAccount() {
    setDirection("forward");
    setView("create-account");
  }

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--color-surface)" }} />
    );
  }

  return (
    <>
    <StatusBanner statusInfo={statusInfo} onDismiss={() => setStatusInfo(null)} />
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="opacity-40 pointer-events-none select-none">
          <HomePageSkeleton />
        </div>
      </div>

      {/* Scrim — ensures text readability over the background */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
      />

      <div className="relative z-10 flex min-h-screen max-h-screen items-center justify-center p-6">
        {/* Mobile card — glassmorphism */}
        <div
          className="w-full max-w-md rounded-3xl p-8 sm:p-12 text-center lg:hidden glass-card overflow-y-auto"
          style={{
            maxHeight: "calc(100vh - 3rem)",
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,.05), 0 10px 24px -4px rgba(0,0,0,.08)",
          }}
        >
          <Image
            src="/transparent-logo.svg"
            alt="Agham Setlist"
            className="mx-auto mb-8 w-36 h-36 sm:w-44 sm:h-44 object-contain"
            width={176}
            height={176}
          />
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Plan your{" "}
            <span style={{ color: "var(--color-accent)" }}>Worship</span>
            <br />
            <span className="text-2xl sm:text-3xl">
              Lead the{" "}
              <span style={{ color: "var(--color-accent)" }}>Congregation</span>
            </span>
          </h1>
          <p
            className="mt-4 text-sm sm:text-base leading-relaxed"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Welcome,{" "}
            <span className="font-semibold" style={{ color: "var(--color-accent)" }}>
              Agham{" "}
            </span>
            worship team!
          </p>
          <AuthCard
            view={view}
            onGoToLogin={goToLogin}
            onGoToCreateAccount={goToCreateAccount}
            onGoToLanding={goToLanding}
            direction={direction}
            onRejected={(name) => setStatusInfo({ type: "rejected", name })}
            onPending={(name) => setStatusInfo({ type: "pending", name })}
          />
        </div>

        {/* Desktop — glassmorphism card for all views */}
        <div
          className="hidden lg:flex w-full rounded-3xl overflow-hidden glass-card"
          style={{
            maxWidth: 1050,
            height: 680,
            maxHeight: "calc(100vh - 3rem)",
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,.05), 0 10px 24px -4px rgba(0,0,0,.08)",
          }}
        >
          {view === "landing" ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <Image
                src="/transparent-logo.svg"
                alt="Agham Setlist"
                className="mb-8 w-36 h-36 object-contain"
                width={144}
                height={144}
              />
              <h1 className="text-3xl font-bold leading-tight tracking-tight">
                Plan your{" "}
                <span style={{ color: "var(--color-accent)" }}>Worship</span>
                <br />
                <span className="text-2xl">
                  Lead the{" "}
                  <span style={{ color: "var(--color-accent)" }}>Congregation</span>
                </span>
              </h1>
              <p
                className="mt-4 text-sm leading-relaxed"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Welcome,{" "}
                <span className="font-semibold" style={{ color: "var(--color-accent)" }}>
                  Agham{" "}
                </span>
                worship team!
              </p>
              <AuthCard
                view={view}
                onGoToLogin={goToLogin}
                onGoToCreateAccount={goToCreateAccount}
                onGoToLanding={goToLanding}
                direction={direction}
              />

              <p
                className="mt-8 text-[10px] leading-relaxed select-none"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Agham Setlist 0.1.3<br />
                Property of AGHAM &copy; {new Date().getFullYear()}<br />
                dev - johndhalecpe
              </p>
            </div>
          ) : (
            <>
              <div className="w-[45%] flex flex-col items-center justify-center text-center p-12">
                <Image
                  src="/transparent-logo.svg"
                  alt="Agham Setlist"
                  className="mb-6 w-36 h-36 object-contain"
                  width={144}
                  height={144}
                />
                <h1 className="text-3xl font-bold leading-tight tracking-tight">
                  Plan your{" "}
                  <span style={{ color: "var(--color-accent)" }}>Worship</span>
                </h1>
                <p className="text-xl mt-1">
                  Lead the{" "}
                  <span style={{ color: "var(--color-accent)" }}>Congregation</span>
                </p>
                <p
                  className="mt-5 text-sm leading-relaxed max-w-xs"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Welcome,{" "}
                  <span className="font-semibold" style={{ color: "var(--color-accent)" }}>
                    Agham
                  </span>{" "}
                  worship team!
                </p>
              </div>
              <div
                className="w-[55%] flex flex-col justify-start overflow-y-auto p-8 glass-panel"
              >
                <AuthCard
                  view={view}
                  onGoToLogin={goToLogin}
                  onGoToCreateAccount={goToCreateAccount}
                  onGoToLanding={goToLanding}
                  direction={direction}
                  onRejected={(name) => setStatusInfo({ type: "rejected", name })}
                  onPending={(name) => setStatusInfo({ type: "pending", name })}
                />
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
