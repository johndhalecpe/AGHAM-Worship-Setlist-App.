import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function isPastDate(id: string): Promise<boolean> {
  const { data } = await supabase
    .from("setlists")
    .select("date")
    .eq("id", id)
    .single();
  if (!data) return false;
  const today = new Date().toISOString().split("T")[0];
  return data.date < today;
}

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

  if (await isPastDate(id)) {
    return NextResponse.json(
      { error: "Cannot modify a past setlist" },
      { status: 403 }
    );
  }

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (await isPastDate(id)) {
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
  const { id } = await params;

  if (await isPastDate(id)) {
    return NextResponse.json(
      { error: "Cannot modify a past setlist" },
      { status: 403 }
    );
  }

  const body = await request.json();

  for (const item of body.items as {
    id: string;
    sort_order?: number;
    notes?: string | null;
  }[]) {
    const update: Record<string, unknown> = {};
    if (item.sort_order !== undefined) update.sort_order = item.sort_order;
    if ("notes" in item) update.notes = item.notes;

    if (Object.keys(update).length === 0) continue;

    const { error } = await supabase
      .from("setlist_sections")
      .update(update)
      .eq("id", item.id)
      .eq("setlist_id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: "Order updated" });
}
