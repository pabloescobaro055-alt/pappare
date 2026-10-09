import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader:false,
  distDir: process.env.CINEMA_BUILD_DIR || ".next",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {source:'/api/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
