import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "places.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ]
  }
};

export default nextConfig;
