import type { MetadataRoute } from "next";

import { pages, siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: new Date("2026-06-10"),
    changeFrequency: page.path === "/" ? "weekly" : "monthly",
    priority: page.path === "/" ? 1 : 0.8,
  }));
}
