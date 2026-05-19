"use client";

import { useEffect, useRef, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import type { ErrorToast as ErrorToastType } from "@/hooks/useErrorToast";

interface Props {
  toast: ErrorToastType | null;
  onDismiss: () => void;
}

export function ErrorToast({ toast, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const prevId = useRef<string | null>(null);

  // Slide in when a new toast appears
  useEffect(() => {
    if (!toast) {
      setVisible(false);
      return;
    }
    if (toast.id !== prevId.current) {
      prevId.current = toast.id;
      // tiny delay so the translate-y transition fires
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-4 sm:right-6 z-[200] w-[calc(100vw-2rem)] max-w-sm transition-all duration-300"
      style={{
        transform: visible ? "translateY(0)" : "translateY(calc(100% + 24px))",
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-2xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid rgba(239,68,68,0.35)",
          boxShadow: "0 8px 32px rgba(239,68,68,0.18), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Icon */}
        <div
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
          style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.28)",
          }}
        >
          <AlertCircle className="w-3.5 h-3.5" style={{ color: "#f87171" }} />
        </div>

        {/* Message */}
        <p
          className="flex-1 text-sm font-semibold leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          {toast.message}
        </p>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-all mt-0.5"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.10)";
            (e.currentTarget as HTMLElement).style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar — drains over 6s */}
      <div
        className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl"
        style={{
          background: "linear-gradient(90deg,#ef4444,#f87171)",
          width: visible ? "0%" : "100%",
          transition: visible ? "width 6s linear" : "none",
          borderRadius: "0 0 16px 16px",
        }}
      />
    </div>
  );
}
