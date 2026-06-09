import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Static, publicly-indexable routes. Wallet-gated views (dashboard) and
// dynamic on-chain pages (job/profile detail) are intentionally omitted.
const ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/jobs", priority: 0.9, changeFrequency: "hourly" },
  { path: "/jobs/new", priority: 0.7, changeFrequency: "monthly" },
  { path: "/analytics", priority: 0.6, changeFrequency: "daily" },
  { path: "/explorer", priority: 0.6, changeFrequency: "hourly" },
  { path: "/docs", priority: 0.7, changeFrequency: "weekly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE.url}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
