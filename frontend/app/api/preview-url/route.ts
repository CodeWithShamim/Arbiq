import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { lookup } from "node:dns/promises";
import net from "node:net";

export interface PreviewResult {
  reachable: boolean;
  ambiguous: boolean;        // true when fetch succeeded but content is uncertain
  title: string;
  description: string;
  favicon: string;
  contentPreview: string;    // first ~300 chars of visible text
  contentLength: number;
  isGitHub: boolean;
  github?: {
    owner: string;
    repo: string;
    repoDescription: string;
    language: string;
    stars: number;
    lastCommit: string;      // ISO date string
    readmePreview: string;
  };
  error?: string;
}

const TIMEOUT_MS = 8_000;
const UA = "Mozilla/5.0 (compatible; Arbiq-Preview/1.0; +https://arbiq.xyz)";

// ── SSRF guard ────────────────────────────────────────────────────────────────
// This route fetches an arbitrary user-supplied URL server-side. Without these
// checks an attacker could reach internal services (cloud metadata at
// 169.254.169.254, localhost admin panels, private LAN hosts). We block
// non-public IPs, resolve DNS and re-check the resolved IP (defeats DNS
// rebinding), and only allow the standard web ports.

const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

function ipToBigInt(ip: string): bigint | null {
  if (net.isIPv4(ip)) {
    return ip.split(".").reduce((acc, oct) => (acc << 8n) + BigInt(Number(oct)), 0n);
  }
  return null;
}

/** True if the IP is loopback / private / link-local / reserved (not publicly routable). */
function isPrivateIp(ip: string): boolean {
  const v = ip.toLowerCase();

  // IPv6 loopback / unspecified / unique-local (fc00::/7) / link-local (fe80::/10)
  if (net.isIPv6(v)) {
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique local
    if (v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true; // link-local
    // IPv4-mapped IPv6 (::ffff:a.b.c.d) — extract and re-check the v4 part
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }

  const n = ipToBigInt(v);
  if (n === null) return true; // unparseable → treat as unsafe

  const inRange = (cidr: string, bits: number): boolean => {
    const base = ipToBigInt(cidr)!;
    const mask = (0xffffffffn >> BigInt(32 - bits)) << BigInt(32 - bits);
    return (n & mask) === (base & mask);
  };

  return (
    inRange("0.0.0.0", 8) ||        // "this" network
    inRange("10.0.0.0", 8) ||       // private
    inRange("100.64.0.0", 10) ||    // CGNAT
    inRange("127.0.0.0", 8) ||      // loopback
    inRange("169.254.0.0", 16) ||   // link-local (incl. 169.254.169.254 metadata)
    inRange("172.16.0.0", 12) ||    // private
    inRange("192.0.0.0", 24) ||     // IETF protocol assignments
    inRange("192.168.0.0", 16) ||   // private
    inRange("198.18.0.0", 15) ||    // benchmarking
    inRange("224.0.0.0", 4) ||      // multicast
    inRange("240.0.0.0", 4)         // reserved
  );
}

/** Validate that a URL is safe to fetch server-side. Throws on rejection. */
async function assertSafeUrl(parsed: URL): Promise<void> {
  if (!ALLOWED_PORTS.has(parsed.port)) {
    throw new Error("Port not allowed");
  }
  const host = parsed.hostname;

  // If the host is already a literal IP, check it directly.
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Blocked address");
    return;
  }

  // Otherwise resolve DNS and verify *every* resolved address is public.
  // Re-checking the resolved IP (not just the hostname) defeats DNS rebinding.
  const records = await lookup(host, { all: true });
  if (records.length === 0) throw new Error("Host did not resolve");
  for (const { address } of records) {
    if (isPrivateIp(address)) throw new Error("Blocked address");
  }
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function extractMeta(html: string, prop: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${prop}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function extractTitle(html: string): string {
  const og = extractMeta(html, "title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() ?? "";
}

function extractFavicon(html: string, base: string): string {
  const m = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i);
  if (!m) return `${new URL(base).origin}/favicon.ico`;
  const href = m[1];
  return href.startsWith("http") ? href : new URL(href, base).toString();
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 500);
}

// ── GitHub fetcher ────────────────────────────────────────────────────────────

async function fetchGitHub(owner: string, repo: string): Promise<PreviewResult["github"]> {
  const headers: HeadersInit = { "User-Agent": UA, "Accept": "application/vnd.github+json" };

  const o = encodeURIComponent(owner);
  const r = encodeURIComponent(repo);
  const [repoRes, readmeRes] = await Promise.allSettled([
    fetch(`https://api.github.com/repos/${o}/${r}`, { headers }),
    fetch(`https://api.github.com/repos/${o}/${r}/readme`, { headers }),
  ]);

  let repoDescription = "";
  let language = "";
  let stars = 0;
  let lastCommit = "";

  if (repoRes.status === "fulfilled" && repoRes.value.ok) {
    const data = await repoRes.value.json();
    repoDescription = data.description ?? "";
    language        = data.language ?? "";
    stars           = data.stargazers_count ?? 0;
    lastCommit      = data.pushed_at ?? "";
  }

  let readmePreview = "";
  if (readmeRes.status === "fulfilled" && readmeRes.value.ok) {
    const data = await readmeRes.value.json();
    if (data.content) {
      const decoded = Buffer.from(data.content, "base64").toString("utf8");
      readmePreview = decoded
        .replace(/```[\s\S]*?```/g, "")
        .replace(/#{1,6}\s/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`]/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim()
        .slice(0, 400);
    }
  }

  return { owner, repo, repoDescription, language, stars, lastCommit, readmePreview };
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function fetchPreview(url: string): Promise<PreviewResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { reachable: false, ambiguous: false, title: "", description: "", favicon: "", contentPreview: "", contentLength: 0, isGitHub: false, error: "Invalid URL" };
  }

  // SSRF guard: reject internal/private targets before any server-side fetch.
  try {
    await assertSafeUrl(parsed);
  } catch {
    return { reachable: false, ambiguous: false, title: "", description: "", favicon: "", contentPreview: "", contentLength: 0, isGitHub: false, error: "URL not allowed" };
  }

  const isGitHub = parsed.hostname === "github.com";
  const ghMatch = isGitHub ? parsed.pathname.match(/^\/([^/]+)\/([^/]+)/) : null;

  // GitHub: hit the API directly
  if (isGitHub && ghMatch) {
    const [, owner, repo] = ghMatch;
    try {
      const gh = await fetchGitHub(owner, repo);
      return {
        reachable: true,
        ambiguous: false,
        title: `${owner}/${repo}`,
        description: gh?.repoDescription ?? "",
        favicon: "https://github.com/favicon.ico",
        contentPreview: gh?.readmePreview ?? "",
        contentLength: gh?.readmePreview?.length ?? 0,
        isGitHub: true,
        github: gh,
      };
    } catch {
      return { reachable: false, ambiguous: false, title: "", description: "", favicon: "", contentPreview: "", contentLength: 0, isGitHub: true, error: "GitHub API error" };
    }
  }

  // Generic URL fetch
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, "Accept": "text/html,*/*" },
    });
    clearTimeout(timer);

    const contentType = res.headers.get("content-type") ?? "";
    const contentLength = parseInt(res.headers.get("content-length") ?? "0", 10);

    // Non-HTML resources (PDF, images, etc.) — reachable but no text to parse
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return {
        reachable: res.ok,
        ambiguous: !res.ok,
        title: parsed.pathname.split("/").pop() ?? url,
        description: `${contentType} resource`,
        favicon: `${parsed.origin}/favicon.ico`,
        contentPreview: `[${contentType} — ${contentLength ? `${Math.round(contentLength / 1024)} KB` : "size unknown"}]`,
        contentLength,
        isGitHub: false,
      };
    }

    // Read up to 64 KB — enough for meta tags + above-fold text
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let bytes = 0;
      while (bytes < 65_536) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        html += decoder.decode(value, { stream: true });
        bytes += value.byteLength;
      }
      reader.cancel();
    }

    const title       = extractTitle(html);
    const description = extractMeta(html, "description");
    const favicon     = extractFavicon(html, url);
    const textContent = extractText(html);

    // Some sites (SPAs) return 200 with near-empty HTML — flag as ambiguous
    const ambiguous = res.ok && textContent.length < 40 && !title;

    return {
      reachable: res.ok,
      ambiguous,
      title,
      description,
      favicon,
      contentPreview: textContent.slice(0, 300),
      contentLength: html.length,
      isGitHub: false,
    };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = (err as Error).name === "AbortError";
    return {
      reachable: false,
      ambiguous: isTimeout,
      title: "",
      description: "",
      favicon: "",
      contentPreview: "",
      contentLength: 0,
      isGitHub: false,
      error: isTimeout ? "Request timed out" : "Unreachable",
    };
  }
}

// Cache each URL for 60 seconds to avoid hammering the same host
const cachedFetch = unstable_cache(
  fetchPreview,
  ["preview-url"],
  { revalidate: 60 },
);

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 });

  // Only allow http/https
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Only http/https URLs allowed" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const result = await cachedFetch(url);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}
