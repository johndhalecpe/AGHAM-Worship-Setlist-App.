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
            Add a song
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
            placeholder="e.g. Amazing Grace"
            className="w-full rounded-lg px-3 py-2 text-sm mt-1.5 transition-colors"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "#D84F0B")
            }
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
            Author
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. John Newton"
            className="w-full rounded-lg px-3 py-2 text-sm mt-1.5 transition-colors"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "#D84F0B")
            }
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
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm mt-1.5 transition-colors"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "#D84F0B")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--color-border)")
            }
          >
            <option value="worship">Worship</option>
            <option value="praise">Praise</option>
            <option value="other">Other (specify)</option>
          </select>
        </div>
        <div>
          <label
            className="text-sm font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Language
          </label>
          <div className="flex gap-4 mt-1.5">
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--color-text)" }}
            >
              <input
                type="radio"
                name="language"
                value="english"
                checked={language === "english"}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ accentColor: "#D84F0B" }}
              />
              English
            </label>
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--color-text)" }}
            >
              <input
                type="radio"
                name="language"
                value="filipino"
                checked={language === "filipino"}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ accentColor: "#D84F0B" }}
              />
              Filipino
            </label>
          </div>
        </div>
        {category === "other" && (
          <div>
            <label
              className="text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Specify category
            </label>
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g. Hymn"
              className="w-full rounded-lg px-3 py-2 text-sm mt-1.5 transition-colors"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "#D84F0B")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-border)")
              }
            />
          </div>
        )}
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
          {loading ? "Saving..." : "Save song"}
        </button>
        </div>
      </div>
    </div>
  );
}
