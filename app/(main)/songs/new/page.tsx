"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewSongPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("worship");
  const [language, setLanguage] = useState("english");
  const [customCategory, setCustomCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!title) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError("");

    const finalCategory = category === "other" ? customCategory : category;

    const res = await fetch("/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        author,
        category: finalCategory,
        language,
      }),
    });

    if (!res.ok) {
      setError("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    router.push("/songs");
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold text-neutral-900 mb-8">Add a song</h2>
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 flex flex-col gap-5">
        <div>
          <label className="text-sm font-medium text-neutral-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Amazing Grace"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">
            Author
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. John Newton"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
          >
            <option value="worship">Worship</option>
            <option value="praise">Praise</option>
            <option value="other">Other (specify)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700">
            Language
          </label>
          <div className="flex gap-4 mt-1.5">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="radio"
                name="language"
                value="english"
                checked={language === "english"}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              English
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="radio"
                name="language"
                value="filipino"
                checked={language === "filipino"}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              Filipino
            </label>
          </div>
        </div>
        {category === "other" && (
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Specify category
            </label>
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g. Hymn"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1.5"
            />
          </div>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : "Save song"}
        </button>
      </div>
    </div>
  );
}
