import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

    const supabaseAdmin = getSupabaseAdmin();
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
