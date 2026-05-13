export default {
  experimental: {
    ppr: true,
    inlineCss: true,
    useCache: true,
  },
  images: {
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
