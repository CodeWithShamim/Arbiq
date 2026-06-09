"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Cookie, Scale } from "lucide-react";

// Icons are resolved here, inside the client component, because function
// components can't be passed as props from a server component.
const ICONS = { shield: Shield, cookie: Cookie, scale: Scale } as const;

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

interface LegalPageProps {
  icon: keyof typeof ICONS;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}

/**
 * Shared layout for static legal pages (Privacy, Cookies). Keeps typography and
 * surface styling consistent with the rest of the app.
 */
export function LegalPage({ icon, title, intro, updated, sections }: LegalPageProps) {
  const Icon = ICONS[icon];
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 md:px-8 pt-28 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.24)",
              color: "#a78bfa",
            }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl" style={{ color: "var(--text-primary)", letterSpacing: "0.02em" }}>
            {title}
          </h1>
        </div>

        <p
          className="text-xs font-semibold uppercase tracking-widest mb-6"
          style={{ color: "var(--text-label-dim)", letterSpacing: "0.12em" }}
        >
          Last updated {updated}
        </p>

        <p className="text-[15px] leading-relaxed mb-10" style={{ color: "var(--text-muted)" }}>
          {intro}
        </p>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2
                className="text-lg font-bold mb-3 flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <span style={{ color: "#7c3aed" }}>{String(i + 1).padStart(2, "0")}</span>
                {s.heading}
              </h2>
              <div className="text-[14px] leading-relaxed space-y-3" style={{ color: "var(--text-muted)" }}>
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <p className="text-xs mt-12 pt-6" style={{ color: "var(--text-label-dim)", borderTop: "1px solid var(--border-divider)" }}>
          Arbiq runs on the GenLayer Bradbury Testnet. GEN tokens have no real monetary value. This
          page describes how the hosted web interface handles data and is provided for transparency,
          not as legal advice.
        </p>
      </main>

      <Footer />
    </div>
  );
}
