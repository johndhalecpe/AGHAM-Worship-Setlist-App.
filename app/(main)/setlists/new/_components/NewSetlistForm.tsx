"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";
import { BRANCHES } from "@/lib/branches";
import { todayLocalISO } from "@/lib/dates";

export default function NewSetlistForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [songLeader, setSongLeader] = useState("");
  const [branch, setBranch] = useState("carissa_1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFormSubmit() {
    if (!date) {
      setError("Date is required");
      return;
    }

    setLoading(true);
    setError("");

    const response = await fetch("/api/setlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        title,
        description,
        song_leader: songLeader,
        branch,
      }),
    });

    if (!response.ok) {
      toast.error("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    toast.success("Setlist created!");
    const createdSetlist = await response.json();
    router.push(`/setlists/${createdSetlist.id}`);
  }

  return (
    <div className="flex-1 flex flex-col -my-4">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 w-fit px-1 py-1 -ml-1 rounded-lg transition-colors"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
        Back
      </button>
      <div className="flex-1 flex items-center justify-center">
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
            Schedule a lineup
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
              name="new-setlist-title"
              autoComplete="off"
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
              minDate={todayLocalISO()}
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
              name="new-setlist-song-leader"
              autoComplete="off"
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
              Branch
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {BRANCHES.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setBranch(b.value)}
                  className="rounded-lg px-3 py-2 text-sm font-medium transition-all text-left"
                  style={{
                    backgroundColor:
                      branch === b.value
                        ? "#D84F0B"
                        : "var(--color-surface)",
                    color:
                      branch === b.value
                        ? "#fff"
                        : "var(--color-text-secondary)",
                    border:
                      branch === b.value
                        ? "1px solid #D84F0B"
                        : "1px solid var(--color-border)",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
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
            onClick={handleFormSubmit}
            disabled={loading}
            className="rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 w-full sm:w-auto"
            style={{
              backgroundColor: "#D84F0B",
              color: "var(--color-text-on-accent)",
            }}
          >
            {loading ? "Saving..." : "Save lineup"}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
