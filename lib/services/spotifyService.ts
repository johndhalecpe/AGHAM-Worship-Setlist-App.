import { getSupabaseAdmin } from "@/lib/supabase-admin";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SCOPES = ["playlist-modify-public", "playlist-modify-private", "user-read-private"].join(" ");

type SpotifyTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

type UserConnection = {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string | null;
  provider_user_id: string | null;
  provider_user_name: string | null;
};

function getRedirectUri(): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${origin}/api/admin/spotify/callback`;
}

export function getSpotifyAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    state,
  });
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<SpotifyTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify token refresh failed: ${err}`);
  }

  return res.json();
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("user_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "spotify")
    .single();

  const conn = data as UserConnection | null;
  if (!conn) throw new Error("Spotify not connected");

  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0;
  const isExpired = Date.now() > expiresAt - 60000;

  if (isExpired) {
    const tokens = await refreshAccessToken(conn.refresh_token);
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await admin
      .from("user_connections")
      .update({
        access_token: tokens.access_token,
        token_expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "spotify");

    return tokens.access_token;
  }

  return conn.access_token;
}

export async function getSpotifyMe(accessToken: string): Promise<{ id: string; display_name: string | null }> {
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to get Spotify user profile");
  return res.json();
}

export async function searchTrack(accessToken: string, query: string): Promise<string | null> {
  const params = new URLSearchParams({ q: query, type: "track", limit: "1" });
  const res = await fetch(`${SPOTIFY_API_BASE}/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.tracks?.items?.[0]?.uri ?? null;
}

export async function createPlaylist(
  accessToken: string,
  name: string,
  description: string
): Promise<{ id: string; external_urls: { spotify: string } }> {
  const res = await fetch(`${SPOTIFY_API_BASE}/me/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description, public: false }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Spotify playlist: ${err}`);
  }
  return res.json();
}

export async function addTracks(accessToken: string, playlistId: string, uris: string[]): Promise<void> {
  if (uris.length === 0) return;
  const res = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to add tracks: ${err}`);
  }
}
