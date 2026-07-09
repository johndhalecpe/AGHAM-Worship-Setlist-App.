import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireUser, unauthorized } from "@/lib/auth-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const updateFields: Record<string, unknown> = {};
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.author !== undefined) updateFields.author = body.author;
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.language !== undefined) updateFields.language = body.language;
    if (body.default_key !== undefined) updateFields.default_key = body.default_key;
    if (body.default_bpm !== undefined) updateFields.default_bpm = body.default_bpm;
    if (body.default_time_signature !== undefined) updateFields.default_time_signature = body.default_time_signature;
    if (body.lyrics !== undefined) updateFields.lyrics = body.lyrics;
    if (body.chords !== undefined) updateFields.chords = body.chords;

    const hasAllDetails = !!(body.default_key && body.default_bpm && body.default_time_signature && body.lyrics);
    if (body.status !== undefined) {
      updateFields.status = body.status;
    } else if (hasAllDetails) {
      updateFields.status = "published";
    }

    const { data, error } = await supabase
      .from("songs")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(request);
    if (!user) return unauthorized();

    const { id } = await params;
    const { error } = await supabase.from("songs").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Song deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
