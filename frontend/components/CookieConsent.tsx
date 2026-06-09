"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, X } from "lucide-react";

// Bump this key if the cookie policy materially changes so the banner
// re-appears for everyone who previously responded.
const CONSENT_KEY = "arbiq:cookie-consent:v1";

export type CookieConsent = "accepted" | "rejected";

/** Read the stored consent value (null if the visitor hasn't chosen yet). */
export function getCookieConsent(): CookieConsent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Bottom-anchored cookie consent banner. Persists the visitor's choice in
 * localStorage and stays hidden once a choice has been made. Matches the
 * surface/border design tokens used across the app.
 */
export function CookieConsent() {
  // Start hidden to avoid a hydration flash; reveal after reading storage.
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (getCookieConsent() === null) setShow(true);

    // Let the footer's "Cookie Settings" link re-open the banner so visitors
    // can change a previously-saved choice without clearing browser storage.
    const open = () => setShow(true);
    (window as Window & { arbiqOpenCookieSettings?: () => void }).arbiqOpenCookieSettings = open;
    return () => {
      delete (window as Window & { arbiqOpenCookieSettings?: () => void }).arbiqOpenCookieSettings;
    };
  }, []);

  const respond = (choice: CookieConsent) => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      /* ignore — banner still dismisses for this session */
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed left-3 right-3 bottom-3 sm:left-auto sm:right-5 sm:max-w-md rounded-2xl p-5"
          style={{
            // Sit above the NetworkWidget (z-index 200, bottom-right corner) and
            // clear it vertically so both stay readable.
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)",
            zIndex: 300,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
          }}
        >
          <button
            onClick={() => respond("rejected")}
            aria-label="Reject non-essential cookies"
            className="absolute right-3 top-3 w-7 h-7 rounded-md flex items-center justify-center transition-all"
            style={{ background: "var(--surface-raised)", color: "var(--text-muted)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-start gap-3 mb-3 pr-6">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(124,58,237,0.12)",
                border: "1px solid rgba(124,58,237,0.24)",
                color: "#a78bfa",
              }}
            >
              <Cookie className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                We use cookies
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Arbiq uses essential cookies to keep the app working and optional ones to
                understand usage. See our{" "}
                <Link href="/cookies" className="font-semibold underline" style={{ color: "#a78bfa" }}>
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-semibold underline" style={{ color: "#a78bfa" }}>
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => respond("accepted")}
              className="btn-primary flex-1 px-4 py-2 rounded-xl text-white font-bold text-[13px]"
            >
              Accept all
            </button>
            <button
              onClick={() => respond("rejected")}
              className="flex-1 px-4 py-2 rounded-xl font-semibold text-[13px] transition-all"
              style={{
                color: "var(--text-label)",
                background: "var(--surface-raised)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              Essential only
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
