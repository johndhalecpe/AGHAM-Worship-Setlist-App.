import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("setlists")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  const today = new Date().toISOString().split("T")[0];
  if (body.date < today) {
    return NextResponse.json(
      { error: "Cannot create a setlist with a past date" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("setlists")
    .insert({
      date: body.date,
      title: body.title,
      description: body.description,
      song_leader: body.song_leader,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
