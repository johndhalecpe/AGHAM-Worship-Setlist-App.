import { NextResponse } from "next/server";
import { requireUser, unauthorized } from "@/lib/auth-server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  const { data } = await supabase
    .from("user_connections")
    .select("provider_user_id, provider_user_name, updated_at")
    .eq("user_id", user.id)
    .eq("provider", "spotify")
    .single();

  return NextResponse.json({
    connected: !!data,
    provider_user_name: data?.provider_user_name ?? null,
  });
}
