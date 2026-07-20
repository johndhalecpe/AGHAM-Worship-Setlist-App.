import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/auth-server";
import { getSupabaseWithToken } from "@/lib/supabase";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return unauthorized();
  const token = authHeader.slice(7);

  const supabase = getSupabaseWithToken(token);

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return unauthorized();
  const user = userData.user;

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
