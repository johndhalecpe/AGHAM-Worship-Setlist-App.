import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireUser, unauthorized } from "@/lib/auth-server";
import { supabase } from "@/lib/supabase";
import { getValidAccessToken, getSpotifyMe, searchTrack, createPlaylist, addTracks } from "@/lib/services/spotifyService";
import type { Setlist, SetlistSectionWithSong } from "@/lib/type";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  if (!process.env.SPOTIFY_CLIENT_ID) {
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

  const songTitles = sections
    .filter((s) => s.songs?.title)
    .map((s) => s.songs.title);

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

  const me = await getSpotifyMe(accessToken);
  const playlist = await createPlaylist(accessToken, me.id, playlistName, playlistDesc);

  const trackUris: string[] = [];
  for (const title of songTitles) {
    const query = `${title}`;
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
    totalSongs: songTitles.length,
  });
}
