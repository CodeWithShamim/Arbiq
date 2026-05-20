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
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm text-white"
      style={{
        background: "linear-gradient(160deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)",
        boxShadow: "0 4px 20px rgba(124,58,237,0.50), 0 0 0 1px rgba(124,58,237,0.30)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(14px) scale(0.94)",
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.3s ease, transform 0.3s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(124,58,237,0.60), 0 0 0 1px rgba(167,139,250,0.40)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.03)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(124,58,237,0.50), 0 0 0 1px rgba(124,58,237,0.30)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)";
      }}
    >
      <PlusCircle className="w-4 h-4" />
      Post a Job
    </Link>
  );
}
