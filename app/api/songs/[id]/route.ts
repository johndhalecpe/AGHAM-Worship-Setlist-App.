import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
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

    if (body.status !== undefined) {
      updateFields.status = body.status;
    } else {
      const { data: existing } = await supabase
        .from("songs")
        .select("title, author, default_key, lyrics, chords")
        .eq("id", id)
        .single();

      const merged = {
        title: body.title !== undefined ? body.title : existing?.title,
        author: body.author !== undefined ? body.author : existing?.author,
        default_key: body.default_key !== undefined ? body.default_key : existing?.default_key,
        lyrics: body.lyrics !== undefined ? body.lyrics : existing?.lyrics,
        chords: body.chords !== undefined ? body.chords : existing?.chords,
      };
      const hasAllDetails = !!(merged.title && merged.author && merged.default_key && merged.lyrics && merged.chords);
      updateFields.status = hasAllDetails ? "published" : "draft";
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

    revalidatePath("/setlists");
    revalidatePath("/setlists/[id]");
    revalidatePath("/songs");
    revalidateTag("songs", "max");
    revalidateTag("setlists", "max");
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

    revalidatePath("/setlists");
    revalidatePath("/setlists/[id]");
    revalidatePath("/songs");
    revalidateTag("songs", "max");
    revalidateTag("setlists", "max");
    return NextResponse.json({ message: "Song deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
