import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AGHAM Worship Setlist",
    short_name: "Agham Setlist",
    display: "standalone",
    start_url: "/",
    theme_color: "#252320",
    background_color: "#F6F4EF",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
