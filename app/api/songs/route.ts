import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTitle = searchParams.get("search");

  let supabaseQuery = supabase
    .from("songs")
    .select("*")
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

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("songs")
    .insert({
      title: body.title,
      author: body.author,
      category: body.category,
      language: body.language,
      default_key: body.default_key ?? "G",
      default_bpm: body.default_bpm ?? 120,
      default_time_signature: body.default_time_signature ?? "4/4",
      lyrics: body.lyrics ?? "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
