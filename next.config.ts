import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/commerce"; // Đổi "/commerce" thành "" khi chuyển sang chạy domain riêng

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
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
