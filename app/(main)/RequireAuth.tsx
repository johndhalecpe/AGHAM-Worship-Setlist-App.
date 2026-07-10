"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setChecking(false);
        return;
      }

      const isGuest = localStorage.getItem("guest_mode") === "true";
      if (isGuest) {
        setChecking(false);
        return;
      }

      router.replace("/");
    })();
  }, [router]);

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-surface)" }}
      />
    );
  }

  return <>{children}</>;
}
