import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/auth-server";
import { getSupabaseWithToken } from "@/lib/supabase";
import { getValidAccessToken } from "@/lib/services/spotifyService";
import type { Setlist } from "@/lib/type";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return unauthorized();
  const token = authHeader.slice(7);

  const supabase = getSupabaseWithToken(token);

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return unauthorized();

  const { id } = await params;

  const { data: setlistData } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", id)
    .single();
  if (!setlistData) {
    return NextResponse.json({ error: "Setlist not found" }, { status: 404 });
  }
  const setlist = setlistData as Setlist;

  if (!setlist.spotify_playlist_id) {
    return NextResponse.json({ exists: false });
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    console.error("getValidAccessToken error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Spotify not connected" }, { status: 400 });
  }

  // Check if the playlist still exists on Spotify
  const res = await fetch(`${SPOTIFY_API_BASE}/playlists/${setlist.spotify_playlist_id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const exists = res.status !== 404;

  if (!exists) {
    await supabase
      .from("setlists")
      .update({
        spotify_playlist_id: null,
        spotify_playlist_url: null,
      })
      .eq("id", id);
  }

  return NextResponse.json({ exists });
}
