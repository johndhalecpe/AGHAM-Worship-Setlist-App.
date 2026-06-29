import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isSetlistDateInPast } from "@/app/api/_lib/setlistGuards";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("setlist_sections")
    .select(
      `
      *,
      songs (
        id,
        title,
        author,
        category,
        default_key,
        default_bpm,
        default_time_signature,
        lyrics,
        chords
      )
    `,
    )
    .eq("setlist_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (await isSetlistDateInPast(id)) {
    return NextResponse.json(
      { error: "Cannot modify a past setlist" },
      { status: 403 }
    );
  }

  const body = await request.json();

    const { data: existingSectionsCount, error: countError } = await supabase
    .from("setlist_sections")
    .select("id")
    .eq("setlist_id", id)
    .eq("section_type", body.section_type);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("setlist_sections")
    .insert({
      setlist_id: id,
      song_id: body.song_id,
      section_type: body.section_type,
      sort_order: existingSectionsCount.length,
    })
    .select(
      `
      *,
      songs (
        id,
        title,
        author,
        category,
        default_key,
        default_bpm,
        default_time_signature,
        lyrics,
        chords
      )
    `,
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (await isSetlistDateInPast(id)) {
    return NextResponse.json(
      { error: "Cannot modify a past setlist" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("sectionId");

  if (!sectionId) {
    return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("setlist_sections")
    .delete()
    .eq("id", sectionId)
    .eq("setlist_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Song removed from setlist" });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (await isSetlistDateInPast(id)) {
      return NextResponse.json(
        { error: "Cannot modify a past setlist" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "Invalid request body: items must be an array" },
        { status: 400 }
      );
    }

    for (const sectionUpdate of body.items) {
      const updatePayload: Record<string, unknown> = {};
      if (sectionUpdate.sort_order !== undefined) updatePayload.sort_order = sectionUpdate.sort_order;
      if ("notes" in sectionUpdate && sectionUpdate.notes !== undefined) updatePayload.notes = sectionUpdate.notes;
      if ("song_key" in sectionUpdate && sectionUpdate.song_key !== undefined) updatePayload.song_key = sectionUpdate.song_key;
      if ("override_lyrics" in sectionUpdate && sectionUpdate.override_lyrics !== undefined) updatePayload.override_lyrics = sectionUpdate.override_lyrics;

      if (Object.keys(updatePayload).length === 0) continue;

      const { error } = await supabase
        .from("setlist_sections")
        .update(updatePayload)
        .eq("id", sectionUpdate.id)
        .eq("setlist_id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "Order updated" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
