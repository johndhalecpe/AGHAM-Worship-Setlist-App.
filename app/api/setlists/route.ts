import { NextResponse } from "next/server";
import { getAllSetlists, createSetlist } from "@/lib/services/setlistsService";

export async function GET() {
  try {
    const setlists = await getAllSetlists();
    return NextResponse.json(setlists);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const setlist = await createSetlist(body);
    return NextResponse.json(setlist, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
