import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { todayLocalISO } from "@/lib/dates";
import { requireUser, unauthorized } from "@/lib/auth-server";

export async function GET() {
  const { data, error } = await supabase
    .from("setlists")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  const body = await request.json();

  const todayISOString = todayLocalISO();
  if (body.date < todayISOString) {
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
      branch: body.branch,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/setlists");
  return NextResponse.json(data, { status: 201 });
}
