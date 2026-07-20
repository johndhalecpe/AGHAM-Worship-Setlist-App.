"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL } from "@/lib/type";

export default function AdminSpotifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<{ connected: boolean; provider_user_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("spotify_connected") === "true") {
      setStatus({ connected: true, provider_user_name: null });
      const url = new URL(window.location.href);
      url.searchParams.delete("spotify_connected");
      router.replace(url.pathname);
      checkStatus();
    }
  }, []);

  async function checkAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push("/setlists");
      return;
    }
    checkStatus();
  }

  async function checkStatus() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { setLoading(false); return; }

    const res = await fetch("/api/admin/spotify/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setStatus(await res.json());
    }
    setLoading(false);
  }

  async function handleConnect() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    window.location.href = `/api/admin/spotify/auth?token=${token}`;
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { setDisconnecting(false); return; }

    await supabase
      .from("user_connections")
      .delete()
      .eq("user_id", session.user.id)
      .eq("provider", "spotify");

    setStatus({ connected: false, provider_user_name: null });
    setDisconnecting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p style={{ color: "var(--color-text-tertiary)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-text)" }}>
        Spotify Integration
      </h1>

      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: "var(--color-surface-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        {status?.connected ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: "#1DB954" }}
              />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  Connected to Spotify
                </p>
                {status.provider_user_name && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                    Account: {status.provider_user_name}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              Playlists will be created on this Spotify account when lineups are saved.
            </p>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors w-fit disabled:opacity-50"
              style={{
                border: "1px solid var(--color-danger)",
                color: "var(--color-danger)",
              }}
            >
              {disconnecting ? "Disconnecting..." : "Disconnect Spotify"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--color-text)" }}>
              Connect your Spotify account to automatically create playlists from lineups.
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              A playlist will be created on your account each time a lineup is saved.
            </p>
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 w-fit"
              style={{
                backgroundColor: "#1DB954",
                color: "#fff",
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.781.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Connect Spotify
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
