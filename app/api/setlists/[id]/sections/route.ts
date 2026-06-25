import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
        category
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
  const body = await request.json();

  const { data: existingSections, error: countError } = await supabase
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
      sort_order: existingSections.length,
    })
    .select(
      `
      *,
      songs (
        id,
        title,
        author,
        category
      )
    `,
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
