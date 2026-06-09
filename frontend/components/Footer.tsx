"use client";

import Link from "next/link";
import { Github, Twitter, ExternalLink } from "lucide-react";

const LINKS = {
  product: [
    { label: "Browse Jobs",  href: "/jobs"       },
    { label: "Post a Job",   href: "/jobs/new"   },
    { label: "Dashboard",    href: "/dashboard"  },
    { label: "Analytics",    href: "/analytics"  },
    { label: "Docs",         href: "/docs"       },
  ],
  chain: [
    { label: "GenLayer Explorer", href: "https://explorer-bradbury.genlayer.com", external: true },
    { label: "GenLayer Docs",     href: "https://docs.genlayer.com",              external: true },
    { label: "Bradbury Testnet",  href: "https://studio.genlayer.com",            external: true },
  ],
};

export function Footer() {
  return (
    <footer
      className="relative overflow-hidden mt-16"
      style={{ borderTop: "1px solid var(--border-divider)", background: "var(--bg-surface)" }}
    >
      <div className="orb orb-violet absolute w-80 h-80 -bottom-28 -left-20 opacity-[0.06] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                  boxShadow: '0 0 12px rgba(124,58,237,0.35)',
                }}
              >
                <span className="font-display text-white text-sm" style={{ letterSpacing: '0.01em', lineHeight: 1 }}>A</span>
              </div>
              <span
                className="font-display text-2xl"
                style={{ color: "var(--text-primary)", letterSpacing: "0.12em" }}
              >
                ARBIQ
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-2 max-w-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Freelance work where the contract enforces payment — not promises.
            </p>
            <p className="text-xs mb-6 max-w-xs" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
              Built on GenLayer Bradbury Testnet. GEN tokens have no real monetary value.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2.5">
              {[
                { icon: Github,  href: "https://github.com/CodeWithShamim/Arbiq", label: "GitHub"  },
                { icon: Twitter, href: "https://x.com/CodeWithShamim",            label: "X / Twitter" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.10)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.24)";
                    (e.currentTarget as HTMLElement).style.color = "#a78bfa";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-raised)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: "#7c3aed", letterSpacing: "0.12em" }}>Product</p>
            <ul className="space-y-3">
              {LINKS.product.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm font-medium transition-colors duration-150"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-label)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Chain links */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: "#7c3aed", letterSpacing: "0.12em" }}>GenLayer</p>
            <ul className="space-y-3">
              {LINKS.chain.map(({ label, href, external }) => (
                <li key={href}>
                  <a
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="text-sm font-medium transition-colors duration-150 inline-flex items-center gap-1.5"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-label)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                  >
                    {label}
                    {external && <ExternalLink className="w-3 h-3 opacity-40" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs font-medium"
          style={{ borderTop: "1px solid var(--border-divider)", color: "var(--text-muted)" }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <span>© 2026 Arbiq. Open source.</span>
            {[
              { label: "Terms", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Cookie Policy", href: "/cookies" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="transition-colors duration-150"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-label)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
              >
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => { (window as Window & { arbiqOpenCookieSettings?: () => void }).arbiqOpenCookieSettings?.(); }}
              className="transition-colors duration-150"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-label)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            >
              Cookie Settings
            </button>
          </div>
          <span className="flex items-center gap-1.5" style={{ opacity: 0.7 }}>
            Running on
            <a
              href="https://genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: "#7c3aed" }}
            >
              GenLayer
            </a>
            Bradbury Testnet · Chain ID 4221
          </span>
        </div>
      </div>
    </footer>
  );
}
