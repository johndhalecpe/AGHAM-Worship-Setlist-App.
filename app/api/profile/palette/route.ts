import { NextResponse } from "next/server";
import { getSupabaseWithToken } from "@/lib/supabase";

export async function GET(request: Request) {
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

  const { data, error } = await authClient
    .from("profiles")
    .select("palette")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ palette: null });
  }

  return NextResponse.json({ palette: data.palette });
}

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

  const { palette } = await request.json();

  if (!palette || typeof palette !== "string") {
    return NextResponse.json({ error: "Palette name is required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { error: updateError } = await authClient
    .from("profiles")
    .update({ palette, updated_at: now })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
