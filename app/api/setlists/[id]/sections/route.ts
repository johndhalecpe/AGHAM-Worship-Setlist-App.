import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isSetlistDateInPast } from "@/app/api/_lib/setlistGuards";
import { requireUser, unauthorized } from "@/lib/auth-server";

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
        chords,
        status
      )
    `,
    )
    .eq("setlist_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

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
        chords,
        status
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
  const user = await requireUser(request);
  if (!user) return unauthorized();

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
  const user = await requireUser(request);
  if (!user) return unauthorized();

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

    const results = await Promise.all(
      body.items.map(async (sectionUpdate: Record<string, unknown>) => {
        const updatePayload: Record<string, unknown> = {};
        if (sectionUpdate.sort_order !== undefined) updatePayload.sort_order = sectionUpdate.sort_order;
        if ("notes" in sectionUpdate && sectionUpdate.notes !== undefined) updatePayload.notes = sectionUpdate.notes;
        if ("song_key" in sectionUpdate && sectionUpdate.song_key !== undefined) updatePayload.song_key = sectionUpdate.song_key;
        if ("override_lyrics" in sectionUpdate && sectionUpdate.override_lyrics !== undefined) updatePayload.override_lyrics = sectionUpdate.override_lyrics;
        if ("chord_notes" in sectionUpdate && sectionUpdate.chord_notes !== undefined) updatePayload.chord_notes = sectionUpdate.chord_notes;

        if (Object.keys(updatePayload).length === 0) return null;

        const { error } = await supabase
          .from("setlist_sections")
          .update(updatePayload)
          .eq("id", sectionUpdate.id)
          .eq("setlist_id", id);

        return error?.message ?? null;
      })
    );

    const errors = results.filter(Boolean) as string[];
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
    }

    return NextResponse.json({ message: "Updated" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
