import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, getSpotifyMe } from "@/lib/services/spotifyService";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("spotify_oauth_state")?.value;
  const savedUserId = cookieStore.get("spotify_oauth_user_id")?.value;

  if (error) {
    return NextResponse.redirect(new URL("/admin/spotify?error=spotify_auth_denied", request.url));
  }

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/admin/spotify?error=spotify_auth_failed", request.url));
  }

  if (!savedUserId) {
    return NextResponse.redirect(new URL("/admin/spotify?error=spotify_auth_failed", request.url));
  }

  try {
    const tokens = await exchangeCode(code);

    let spotifyUserId: string | undefined;
    let spotifyUserName: string | undefined;
    try {
      const me = await getSpotifyMe(tokens.access_token);
      spotifyUserId = me.id;
      spotifyUserName = me.display_name ?? undefined;
    } catch {
      // non-critical — continue without profile info
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const admin = getSupabaseAdmin();
    await admin.from("user_connections").upsert(
      {
        user_id: savedUserId,
        provider: "spotify",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        provider_user_id: spotifyUserId ?? null,
        provider_user_name: spotifyUserName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    const response = NextResponse.redirect(new URL("/admin/spotify?spotify_connected=true", request.url));

    response.cookies.set("spotify_oauth_state", "", { maxAge: 0, path: "/" });
    response.cookies.set("spotify_oauth_user_id", "", { maxAge: 0, path: "/" });

    return response;
  } catch (err) {
    console.error("Spotify OAuth callback error:", err);
    return NextResponse.redirect(new URL("/admin/spotify?error=spotify_auth_failed", request.url));
  }
}
