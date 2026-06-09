/**
 * Central site metadata used for SEO (titles, descriptions, sitemap, robots,
 * Open Graph). Override the base URL per-deploy with NEXT_PUBLIC_SITE_URL.
 */
export const SITE = {
  name: "Arbiq",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://arbiq.app").replace(/\/$/, ""),
  tagline: "Trustless Freelance on GenLayer",
  description:
    "The first freelance marketplace where payment is enforced by AI consensus, not promises. Post work, get paid in GEN — no middlemen, no disputes left unresolved.",
  twitter: "@CodeWithShamim",
} as const;

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = ""): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
