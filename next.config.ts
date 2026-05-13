import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "docs",
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "down-bs-vn.img.susercontent.com",
      },
      {
        protocol: "https",
        hostname: "deo.shopeemobile.com",
      },
      {
        protocol: "https",
        hostname: "down-vn.img.susercontent.com",
      },
    ],
  },
};

export default nextConfig;
