import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("songs")
    .select("author")
    .not("author", "is", null)
    .order("author", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const authors = [...new Set(data.map((s) => s.author))];

  return NextResponse.json(authors, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
