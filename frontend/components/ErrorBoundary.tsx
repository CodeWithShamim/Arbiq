"use client";

import React from "react";
import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--bg-primary)" }}
      >
        {/* Ambient orb */}
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(239,68,68,0.08) 0%, transparent 70%)",
          }}
        />

        <div
          className="relative w-full max-w-md rounded-3xl p-8 text-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid rgba(239,68,68,0.22)",
            boxShadow: "0 0 60px rgba(239,68,68,0.08)",
          }}
        >
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.22)",
            }}
          >
            <AlertTriangle className="w-8 h-8" style={{ color: "#f87171" }} />
          </div>

          {/* Brand */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#a78bfa", boxShadow: "0 0 8px #a78bfa" }}
            />
            <span
              className="font-display text-lg tracking-widest"
              style={{ color: "var(--text-primary)", letterSpacing: "0.14em" }}
            >
              ARBIQ
            </span>
          </div>

          <h1
            className="text-xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Something went wrong
          </h1>
          <p
            className="text-sm mb-6 leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            An unexpected error occurred in the application. Your wallet and
            on-chain data are safe.
          </p>

          {/* Error detail — collapsed, monospace */}
          <details className="mb-6 text-left">
            <summary
              className="text-xs font-semibold cursor-pointer mb-2 select-none"
              style={{ color: "var(--text-muted)" }}
            >
              Error details
            </summary>
            <div
              className="rounded-xl p-3 overflow-auto max-h-32 text-[11px] leading-relaxed"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
                fontFamily: '"JetBrains Mono", monospace',
                color: "#f87171",
                wordBreak: "break-all",
              }}
            >
              {error.message || String(error)}
            </div>
          </details>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.reset}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white btn-primary transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <a
              href="https://github.com/CodeWithShamim/Arbiq/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border-mid)",
                color: "var(--text-secondary)",
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Report issue
            </a>
          </div>
        </div>
      </div>
    );
  }
}
