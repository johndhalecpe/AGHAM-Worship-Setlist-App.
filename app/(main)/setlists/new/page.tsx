"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold text-neutral-900 mb-8">
        Add a setlist
      </h2>
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 flex flex-col gap-5">
        <div>
          <label className="text-sm font-medium text-neutral-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sunday Morning Service"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Baptism Sunday"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
            rows={2}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">
            Song leader
          </label>
          <input
            type="text"
            value={songLeader}
            onChange={(e) => setSongLeader(e.target.value)}
            placeholder="e.g. Juan dela Cruz"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : "Save setlist"}
        </button>
      </div>
    </div>
  );
}
