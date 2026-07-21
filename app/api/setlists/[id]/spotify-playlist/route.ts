import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { unauthorized } from "@/lib/auth-server";
import { getSupabaseWithToken } from "@/lib/supabase";
import { getValidAccessToken, searchTrack, createPlaylist, addTracks } from "@/lib/services/spotifyService";
import type { Setlist, SetlistSectionWithSong } from "@/lib/type";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return unauthorized();
  const token = authHeader.slice(7);

  const supabase = getSupabaseWithToken(token);

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return unauthorized();
  const user = userData.user;

  const { id } = await params;

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return NextResponse.json({ error: "Spotify integration not configured" }, { status: 501 });
  }

  const { data: setlistData } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", id)
    .single();
  if (!setlistData) {
    return NextResponse.json({ error: "Setlist not found" }, { status: 404 });
  }
  const setlist = setlistData as Setlist;

  const { data: sectionsData } = await supabase
    .from("setlist_sections")
    .select("*, songs(id, title, author)")
    .eq("setlist_id", id)
    .order("sort_order", { ascending: true });
  const sections = (sectionsData ?? []) as SetlistSectionWithSong[];
  if (sections.length === 0) {
    return NextResponse.json({ error: "Setlist has no songs" }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(user.id);
  } catch {
    return NextResponse.json({ error: "Spotify not connected. Go to Admin → Spotify to connect." }, { status: 400 });
  }

  const songs = sections
    .filter((s) => s.songs?.title)
    .map((s) => ({ title: s.songs.title, author: s.songs.author }));

  const date = new Date(setlist.date + "T00:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const branch = setlist.branch.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const playlistName = setlist.title ? `${setlist.title} — ${date}` : `AGHAM Worship — ${branch} — ${date}`;
  const playlistDesc = [
    `AGHAM Worship Team Lineup`,
    setlist.song_leader && `Song leader: ${setlist.song_leader}`,
    setlist.title && `"${setlist.title}"`,
    setlist.description,
    date,
  ].filter(Boolean).join(" · ");

  const playlist = await createPlaylist(accessToken, playlistName, playlistDesc);

  const trackUris: string[] = [];
  for (const song of songs) {
    const query = song.author ? `${song.title} ${song.author}` : song.title;
    const uri = await searchTrack(accessToken, query);
    if (uri) trackUris.push(uri);
  }

  await addTracks(accessToken, playlist.id, trackUris);

  await supabase
    .from("setlists")
    .update({
      spotify_playlist_id: playlist.id,
      spotify_playlist_url: playlist.external_urls.spotify,
    })
    .eq("id", id);

  revalidatePath("/setlists");
  revalidatePath(`/setlists/${id}`);
  revalidateTag("setlists", "max");
  revalidateTag(`setlist-${id}`, "max");

  return NextResponse.json({
    success: true,
    playlistUrl: playlist.external_urls.spotify,
    tracksAdded: trackUris.length,
    totalSongs: songs.length,
  });
}
