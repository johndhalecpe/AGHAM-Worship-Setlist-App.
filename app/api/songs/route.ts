import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireUser, unauthorized } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTitle = searchParams.get("search");

    let supabaseQuery = supabase
      .from("songs")
      .select("id, title, author, category, language, default_key, default_bpm, default_time_signature, lyrics, chords, status, created_at")
      .order("title", { ascending: true });

    if (searchTitle) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${searchTitle}%,author.ilike.%${searchTitle}%,lyrics.ilike.%${searchTitle}%`
      );
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  const body = await request.json();

  const hasDetails = !!(body.default_key && body.default_bpm && body.default_time_signature && body.lyrics);
  const status = hasDetails ? "published" : "draft";

  const { data, error } = await supabase
    .from("songs")
    .insert({
      title: body.title,
      author: body.author,
      category: body.category,
      language: body.language,
      default_key: body.default_key ?? null,
      default_bpm: body.default_bpm ?? null,
      default_time_signature: body.default_time_signature ?? null,
      lyrics: body.lyrics ?? null,
      chords: body.chords ?? null,
      status,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
