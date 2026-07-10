import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const trimmed = name.trim();

  try {
    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient
      .from("profiles")
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
