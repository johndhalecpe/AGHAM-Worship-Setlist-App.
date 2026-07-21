export const CURRENT_VERSION = "0.1.4";

export type WhatsNewUpdate = {
  icon: string;
  category: string[];
  title: string;
  description: string;
  link?: string;
};

export type WhatsNewRelease = {
  version: string;
  latest: boolean;
  releasedAt: string;
  updates: WhatsNewUpdate[];
};

export const RELEASES: WhatsNewRelease[] = [
  {
    version: "0.1.4",
    latest: true,
    releasedAt: "2026-07-21",
    updates: [
      {
        icon: "palette",
        category: ["New"],
        title: "Palette Personalization",
        description:
          "Choose from a growing library of color palettes to make the app feel your own. Accent and secondary colors update across the entire interface instantly.",
      },
      {
        icon: "palette",
        category: ["New"],
        title: "Dynamic Logo Color",
        description:
          "The app logo now adapts to your selected palette, keeping the branding cohesive no matter which theme you choose.",
      },
      {
        icon: "sparkles",
        category: ["New"],
        title: "Spotify Playlist Generation",
        description:
          "Generate Spotify playlists directly from your setlists with one click. Each song with a Spotify link is automatically added to a new playlist.",
      },
      {
        icon: "settings",
        category: ["New"],
        title: "Admin Spotify OAuth Setup",
        description:
          "Admins can connect their Spotify account through the admin panel. OAuth handles authentication securely, with credential validation and automatic error reporting.",
      },
      {
        icon: "sparkles",
        category: ["New"],
        title: "Anniversary Card Variant",
        description:
          "Lineup cards now detect anniversary events automatically, adding a subtle corner glow, shimmer animation, beveled border, and confetti accents for a special celebratory feel.",
      },
      {
        icon: "rocket",
        category: ["Improvement"],
        title: "Mobile Lineup Card Restructure",
        description:
          "Lineup cards on mobile now use a clean 4-row layout — date, title, description, and song leader — making them easier to scan on smaller screens. Desktop layout is preserved.",
      },
      {
        icon: "bug",
        category: ["Bug Fix"],
        title: "UI Fixes Across Views",
        description:
          "Multiple fixes across chords, lyrics, and preview views including alignment improvements, hint text removal, and consistent styling for past and upcoming lineups.",
      },
    ],
  },
];

export const LATEST_RELEASE = RELEASES[0];
