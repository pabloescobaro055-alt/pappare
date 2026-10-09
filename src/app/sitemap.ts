import type { MetadataRoute } from "next";

import { pages, siteUrl } from "@/lib/seo";
import {loadEvents} from '@/lib/cinema/events';
export const dynamic='force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events=await loadEvents();
  return [...pages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    changeFrequency: page.path === "/" ? "weekly" as const : "monthly" as const,
    priority: page.path === "/" ? 1 : 0.8,
  })),{url:siteUrl+'/kino',changeFrequency:'weekly',priority:0.8},
  ...events.map(event=>({url:siteUrl+'/kino/'+event.slug,changeFrequency:'weekly' as const,priority:0.7}))];
}
