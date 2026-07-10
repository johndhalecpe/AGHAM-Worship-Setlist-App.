import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { requireUser, unauthorized } from "@/lib/auth-server";
import { isSetlistDateInPast } from "@/app/api/_lib/setlistGuards";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("setlists")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  if (await isSetlistDateInPast(id)) {
    return NextResponse.json(
      { error: "Cannot edit a past setlist" },
      { status: 403 }
    );
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("setlists")
    .update({
      date: body.date,
      title: body.title,
      description: body.description,
      song_leader: body.song_leader,
      branch: body.branch,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/setlists");
  return NextResponse.json(data);
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
      { error: "Cannot delete a past setlist" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("setlists")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/setlists");
  return NextResponse.json({ message: "Setlist deleted" });
}
