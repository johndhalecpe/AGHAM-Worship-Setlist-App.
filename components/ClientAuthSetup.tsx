"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ClientAuthSetup() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    (window as { fetch: typeof fetch }).fetch = async (url, options) => {
      if (typeof url === "string" && url.startsWith("/api/")) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const headers = new Headers(options?.headers);
          headers.set("Authorization", `Bearer ${session.access_token}`);
          options = { ...options, headers };
        }
      }
      return originalFetch(url, options);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  return null;
}
