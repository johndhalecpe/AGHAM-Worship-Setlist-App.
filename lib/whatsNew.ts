export const CURRENT_VERSION = "0.1.3";

export type ChangelogGroup = {
  type: "Added" | "Fixed" | "Changed" | "Removed";
  items: string[];
};

export type ChangelogEntry = {
  version: string;
  date: string;
  groups: ChangelogGroup[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.1.3",
    date: "2026-07-05",
    groups: [
      {
        type: "Added",
        items: [
          "What's New modal showing changelog on version updates",
          "Secondary accent color (teal) for visual variety",
        ],
      },
      {
        type: "Fixed",
        items: [
          "Hydration errors on dark mode toggle and lock state",
        ],
      },
      {
        type: "Changed",
        items: [
          "Code clarity improvements — descriptive variable names throughout",
          "Service layer extracted — database logic separated from components",
        ],
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-07-01",
    groups: [
      {
        type: "Added",
        items: [
          "Setlist management — create, edit, and delete lineups",
          "Song library — add, edit, and organize songs",
          "Section-based lineup builder with drag-and-drop reordering",
          "Key picker for each song in a lineup",
          "Dark mode toggle",
          "Copy lineup text to clipboard for sharing",
        ],
      },
    ],
  },
];

export const LATEST_CHANGELOG = CHANGELOG[0];
