"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Github,
  Globe,
  Star,
  GitCommitHorizontal,
  Loader2,
} from "lucide-react";
import type { PreviewResult } from "@/app/api/preview-url/route";

// ── Confidence scoring ────────────────────────────────────────────────────────

function scoreConfidence(
  preview: PreviewResult,
  jobKeywords: string[],
): "high" | "medium" | "low" {
  if (!preview.reachable) return "low";

  const haystack = [
    preview.title,
    preview.description,
    preview.contentPreview,
    preview.github?.readmePreview ?? "",
    preview.github?.repoDescription ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const hits = jobKeywords.filter((kw) => haystack.includes(kw.toLowerCase())).length;
  const coverageRatio = jobKeywords.length > 0 ? hits / jobKeywords.length : 0;

  if (preview.ambiguous) return "medium";
  if (preview.isGitHub && preview.github?.readmePreview) {
    return coverageRatio >= 0.3 ? "high" : "medium";
  }
  if (preview.contentPreview.length < 40) return "medium";
  if (coverageRatio >= 0.3) return "high";
  if (coverageRatio > 0) return "medium";
  return preview.reachable ? "medium" : "low";
}

const CONFIDENCE_CONFIG = {
  high:   { label: "High",   color: "#22c55e", bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.22)"  },
  medium: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.22)" },
  low:    { label: "Low",    color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.22)"  },
};

// ── Date formatter ────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Status row ────────────────────────────────────────────────────────────────

function StatusRow({ preview }: { preview: PreviewResult }) {
  if (preview.reachable && !preview.ambiguous) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#22c55e" }} />
        <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>
          URL reachable — AI validators can access this
        </span>
      </div>
    );
  }
  if (preview.ambiguous) {
    return (
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#f59e0b" }} />
        <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
          URL may be rate-limited for bots — AI might see limited content
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />
      <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>
        URL not reachable — AI validators cannot fetch this URL
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface EvidencePreviewProps {
  url: string;
  jobTitle?: string;
  jobDescription?: string;
}

export function EvidencePreview({ url, jobTitle = "", jobDescription = "" }: EvidencePreviewProps) {
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUrl = useRef("");

  // Extract simple keywords from job title + description
  const jobKeywords = [jobTitle, jobDescription]
    .join(" ")
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = url.trim();
    if (!trimmed || !/^https?:\/\/.+/.test(trimmed)) {
      setPreview(null);
      setLoading(false);
      return;
    }
    if (trimmed === lastUrl.current) return;

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      lastUrl.current = trimmed;
      try {
        const res = await fetch(`/api/preview-url?url=${encodeURIComponent(trimmed)}`);
        const data: PreviewResult = await res.json();
        setPreview(data);
      } catch {
        setPreview({
          reachable: false, ambiguous: false,
          title: "", description: "", favicon: "",
          contentPreview: "", contentLength: 0,
          isGitHub: false, error: "Preview failed",
        });
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => { debounceRef.current && clearTimeout(debounceRef.current); };
  }, [url]);

  // Don't render anything until there's a valid-looking URL
  if (!url.trim() || !/^https?:\/\/.+/.test(url.trim())) return null;

  if (loading) {
    return (
      <div
        className="mt-2 rounded-xl p-3 flex items-center gap-2"
        style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--text-muted)" }} />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Fetching preview…</span>
      </div>
    );
  }

  if (!preview) return null;

  const confidence = scoreConfidence(preview, jobKeywords);
  const conf = CONFIDENCE_CONFIG[confidence];

  return (
    <div
      className="mt-2 rounded-xl overflow-hidden"
      style={{
        background: "var(--surface-card)",
        border: `1px solid ${preview.reachable ? "var(--border-mid)" : "rgba(239,68,68,0.25)"}`,
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: "1px solid var(--border-divider)", background: "var(--surface-subtle)" }}
      >
        <StatusRow preview={preview} />

        {/* Confidence pill */}
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
          style={{ background: conf.bg, border: `1px solid ${conf.border}`, color: conf.color }}
        >
          AI confidence: {conf.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2.5">
        {/* Site identity */}
        {(preview.title || preview.description) && (
          <div className="flex items-start gap-2.5">
            {/* Favicon / GitHub icon */}
            <div className="flex-shrink-0 mt-0.5">
              {preview.isGitHub ? (
                <Github className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              ) : preview.favicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.favicon}
                  alt=""
                  className="w-4 h-4 rounded-sm object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <Globe className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {preview.title || url}
              </p>
              {preview.description && (
                <p
                  className="text-xs leading-relaxed mt-0.5 line-clamp-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {preview.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* GitHub-specific stats */}
        {preview.isGitHub && preview.github && (
          <div className="flex flex-wrap gap-3">
            {preview.github.language && (
              <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#f59e0b" }}
                />
                {preview.github.language}
              </span>
            )}
            {preview.github.stars > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                <Star className="w-3 h-3" />
                {preview.github.stars.toLocaleString()}
              </span>
            )}
            {preview.github.lastCommit && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                <GitCommitHorizontal className="w-3 h-3" />
                Last commit {fmtDate(preview.github.lastCommit)}
              </span>
            )}
          </div>
        )}

        {/* Content preview ("AI will see") */}
        {preview.contentPreview && (
          <div
            className="rounded-lg p-2.5"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              AI will see:
            </p>
            <p
              className="text-[11px] leading-relaxed line-clamp-4"
              style={{
                color: "var(--text-secondary)",
                fontFamily: preview.isGitHub ? '"JetBrains Mono", monospace' : undefined,
              }}
            >
              {preview.contentPreview}
            </p>
          </div>
        )}

        {/* Open link */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
          style={{ color: "#7c3aed" }}
        >
          <ExternalLink className="w-3 h-3" />
          Open URL
        </a>
      </div>
    </div>
  );
}
