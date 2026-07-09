"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL } from "@/lib/type";

export default function AdminAllUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<{ user_id: string; email: string; name: string; role: string | null; status: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user || user.email !== ADMIN_EMAIL) {
      router.push("/setlists");
      return;
    }

    const token = session!.access_token;
    const res = await fetch("/api/admin/active-users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const json = await res.json();
      setUsers(json.users);
    }
    setLoading(false);
  }

  return (
    <div>
      <Link
        href="/admin/approvals"
        className="inline-flex items-center gap-1 text-sm font-medium mb-4 transition-opacity hover:opacity-70"
        style={{ color: "var(--color-accent)" }}
      >
        &larr; Approvals
      </Link>

      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
        All Users
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-tertiary)" }}>
        All registered users.
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
          Loading...
        </p>
      ) : users.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
          No users found.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.user_id}
              className="rounded-xl px-4 py-3"
              style={{
                backgroundColor: "var(--color-surface-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                    {u.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {u.role && (
                      <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--color-accent-secondary)" }}>
                        {u.role}
                      </span>
                    )}
                    {u.status && u.status !== "approved" && (
                      <span
                        className="text-[11px] uppercase tracking-wider font-medium"
                        style={{ color: u.status === "pending" ? "var(--color-accent-secondary)" : "var(--color-danger)" }}
                      >
                        {u.status}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{u.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
