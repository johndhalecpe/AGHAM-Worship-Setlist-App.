import { NextResponse } from "next/server";
import { getSupabaseWithToken } from "@/lib/supabase";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const authClient = getSupabaseWithToken(token);

  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const trimmed = name.trim();
  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await authClient
    .from("profiles")
    .update({ name: trimmed, updated_at: now })
    .eq("id", user.id)
    .select();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    const role =
      (user.user_metadata?.role as string) ?? "singer";
    const { error: insertError } = await authClient
      .from("profiles")
      .insert({
        id: user.id,
        name: trimmed,
        role,
        status: "pending",
        created_at: now,
        updated_at: now,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
