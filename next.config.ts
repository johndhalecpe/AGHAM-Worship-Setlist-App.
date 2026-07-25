import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 600,
    },
  },
};

export default nextConfig;
