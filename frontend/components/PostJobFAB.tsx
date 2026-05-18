"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function PostJobFAB() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Link
      href="/jobs/new"
      aria-label="Post a Job"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm text-white transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, #7c3aed, #6366f1)",
        boxShadow: "0 4px 24px rgba(124,58,237,0.45)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
        pointerEvents: visible ? "auto" : "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 32px rgba(124,58,237,0.6)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(124,58,237,0.45)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)";
      }}
    >
      <PlusCircle className="w-4 h-4" />
      Post a Job
    </Link>
  );
}
