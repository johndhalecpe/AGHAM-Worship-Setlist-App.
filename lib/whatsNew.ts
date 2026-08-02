export const CURRENT_VERSION = "0.1.5";

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
    version: "0.1.5",
    latest: true,
    releasedAt: "2026-08-02",
    updates: [
      {
        icon: "rocket",
        category: ["New"],
        title: "Real-Time Collaborative Editing",
        description:
          "When a song's chords or Key are open, edits show up live for everyone viewing the same song about 2 seconds after typing pauses — shown as a highlighted preview until the save is confirmed. Presence avatars show who else is viewing the song, and a toast lets you know when another person updates a field you are actively editing. Guests can watch live but cannot send edits.",
      },
      {
        icon: "settings",
        category: ["Improvement"],
        title: "Collapsible Lyrics Viewer",
        description:
          "Song lyrics now start collapsed so long songs don't flood the screen. Tap a title to expand it — only one song shows at a time, and the viewer scrolls to the top of the song. Copy and Key controls stay visible, and a small zoom control lets you bump the text size up a bit.",
      },
      {
        icon: "sparkles",
        category: ["Improvement"],
        title: "Your View Stays Where You Left It",
        description:
          "Refreshing the page no longer resets your place. Open chord/lyrics viewers, expanded lineup cards, past lineups, chord zoom, and the mobile menu now remember their state between visits.",
      },
      {
        icon: "wrench",
        category: ["Improvement"],
        title: "What's New Moved to Settings",
        description:
          "The What's New button no longer clutters the header and viewer screens. It now lives under Settings in the mobile menu, with the latest updates still auto-appearing on new versions.",
      },
      {
        icon: "bug",
        category: ["Bug Fix"],
        title: "Chord Edits Refresh Lineups Instantly",
        description:
          "Saving a song's chords now immediately refreshes every lineup that includes it, so stale values no longer linger on screen until a manual refresh.",
      },
    ],
  },
  {
    version: "0.1.4",
    latest: false,
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
