import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);

    const { data: { user }, error: authError } = await getSupabase().auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({
        error: "Unauthorized",
        message: authError?.message ?? "Could not verify user from token",
      }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json({ error: "Missing env: NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 });
    }
    if (!serviceKey) {
      return NextResponse.json({ error: "Missing env: SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email, newPassword, resetId } = await request.json();
    if (!email || !newPassword || !resetId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("get_all_users");
    if (rpcError) {
      return NextResponse.json({ error: typeof rpcError === "string" ? rpcError : rpcError.message }, { status: 500 });
    }

    const found = ((rpcData ?? []) as { user_id: string; email: string }[]).find((u) => u.email === email);
    if (!found) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      found.user_id,
      { password: newPassword },
    );
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { error: resolveError } = await supabaseAdmin
      .from("password_resets")
      .update({ resolved: true })
      .eq("id", resetId);
    if (resolveError) {
      return NextResponse.json({ error: resolveError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("set-password route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
