"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";

// Bump this key when a new version ships so the alert re-appears for everyone
// who previously dismissed an older one.
const VERSION_KEY = "arbiq:version-alert:v2";

/**
 * Site-wide, dismissible announcement for the v2 contract upgrade. Sits just
 * below the navbar (matching WrongNetworkBanner's offset) and persists dismissal
 * in localStorage per version.
 */
export function VersionAlert() {
  // Start hidden to avoid a hydration flash; reveal after we've read storage.
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(VERSION_KEY) !== "dismissed") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(VERSION_KEY, "dismissed");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed left-0 right-0 z-60 flex items-center justify-center gap-3 px-4 py-2.5"
      style={{
        top: 62,
        background: "linear-gradient(90deg, #7c3aed, #6366f1)",
        color: "white",
        boxShadow: "0 4px 20px rgba(124,58,237,0.25)",
      }}
    >
      <Sparkles className="w-4 h-4 shrink-0" />
      <p className="text-[13px] font-semibold text-center">
        <span className="font-bold">Arbiq v2 is live</span>
        <span className="hidden sm:inline">
          {" "}— upgraded contract with proposals, refunds, deadlines, disputes &amp; ratings.
        </span>
      </p>

      <Link
        href="/docs#contract"
        className="hidden sm:inline-flex items-center gap-1 text-[12px] font-bold px-3 py-1 rounded-lg shrink-0 transition-all"
        style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.35)" }}
      >
        What&apos;s new <ArrowRight className="w-3 h-3" />
      </Link>

      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 w-6 h-6 rounded-md flex items-center justify-center transition-all"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
