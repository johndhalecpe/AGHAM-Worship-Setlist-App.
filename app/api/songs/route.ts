import { NextResponse } from "next/server";
import { getAllSongs, createSong } from "@/lib/services/songsService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTitle = searchParams.get("search");

  try {
    const songs = await getAllSongs(searchTitle ?? undefined);
    return NextResponse.json(songs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const song = await createSong(body);
    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
