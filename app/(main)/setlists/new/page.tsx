"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/setlists/DatePicker";

export default function NewSetlistPage() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [songLeader, setSongLeader] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!date) {
      setError("Date is required");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/setlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        title,
        description,
        song_leader: songLeader,
      }),
    });

    if (!res.ok) {
      setError("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    const newSetlist = await res.json();
    router.push(`/setlists/${newSetlist.id}`);
  }

  return (
    <div className="flex-1 flex items-center justify-center -my-4">
      <div className="w-full max-w-xl">
        <div
          className="rounded-xl p-6 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--color-surface-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Add a setlist
          </h2>
          <div>
            <label
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday Morning Service"
              className="w-full rounded-lg px-3 py-2 text-sm mt-1.5 transition-colors"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D84F0B")}
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-border)")
              }
            />
          </div>

          <div>
            <label
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Date
            </label>
            <DatePicker
              value={date}
              onChange={setDate}
              minDate={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div>
            <label
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Song leader
            </label>
            <input
              type="text"
              value={songLeader}
              onChange={(e) => setSongLeader(e.target.value)}
              placeholder="e.g. Kevin Acebuche"
              className="w-full rounded-lg px-3 py-2 text-sm mt-1.5 transition-colors"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D84F0B")}
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-border)")
              }
            />
          </div>
          <div>
            <label
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Sunday Service"
              className="w-full rounded-lg px-3 py-2.5 text-sm mt-1.5 transition-colors"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D84F0B")}
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-border)")
              }
              rows={3}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 w-full sm:w-auto"
            style={{
              backgroundColor: "#D84F0B",
              color: "var(--color-surface-card)",
            }}
          >
            {loading ? "Saving..." : "Save setlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
