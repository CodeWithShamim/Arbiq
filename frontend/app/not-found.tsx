import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
        {/* Background orbs */}
        <div className="orb orb-violet absolute w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none" />
        <div className="dot-grid opacity-20" />

        {/* 404 glitch number */}
        <div className="relative z-10 mb-6">
          <p
            className="font-display select-none"
            style={{
              fontSize: "clamp(6rem, 20vw, 14rem)",
              lineHeight: 1,
              letterSpacing: "0.04em",
              background: "linear-gradient(135deg, rgba(124,58,237,0.5) 0%, rgba(167,139,250,0.3) 50%, rgba(124,58,237,0.5) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </p>
        </div>

        <h1
          className="text-2xl font-bold mb-3 relative z-10"
          style={{ color: "var(--text-primary)" }}
        >
          Page not found
        </h1>
        <p
          className="text-sm mb-10 max-w-xs font-medium relative z-10"
          style={{ color: "var(--text-muted)" }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
          <Link
            href="/"
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/jobs"
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-mid)",
              color: "var(--text-label)",
            }}
          >
            Browse Jobs
          </Link>
        </div>
      </main>
    </div>
  );
}
