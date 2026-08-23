import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors https://*.discord.com https://discord.com",
          },
          {
            key: "X-Frame-Options",
            value: "ALLOW-FROM https://discord.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
