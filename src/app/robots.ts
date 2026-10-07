import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/_next/", "/api/", "/kino/admin", "/kino/order/"],
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/_next/", "/api/", "/kino/admin", "/kino/order/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/_next/", "/api/", "/kino/admin", "/kino/order/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
