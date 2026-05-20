"use client";
import { useEffect, useRef } from "react";

const STRINGS = [
  "GL.CONTRACT.TRANSFER()", "auto_evaluate()", "STATUS:APPROVED",
  "VALIDATOR_CONSENSUS_OK", "LLM_INFERENCE_COMPLETE",
  "EVIDENCE_URL:VERIFIED", "OPTIMISTIC_DEMOCRACY",
  "GEN_ESCROW:450", "BLOCK_FINALIZED", "eq_principle.strict_eq()",
  "PROPOSING→COMMITTING→REVEALING", "HASH_MATCH:7/7",
  "FREELANCER_PAID", "DISPUTE_RESOLVED", "AI_JURY:UNANIMOUS",
];

const MAX_FLOATS = 15;

export function DataFloats() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Reduce motion check
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pool: HTMLDivElement[] = [];

    const spawn = () => {
      if (pool.length >= MAX_FLOATS) {
        // Recycle oldest
        const old = pool.shift()!;
        old.remove();
      }
      const el = document.createElement("div");
      const str = STRINGS[Math.floor(Math.random() * STRINGS.length)];
      const x = Math.random() * 90;
      const duration = 15 + Math.random() * 12;
      el.textContent = str;
      el.style.cssText = `
        position:absolute;
        left:${x}%;
        bottom:0;
        font-family:'JetBrains Mono',monospace;
        font-size:10px;
        color:rgba(0,240,255,0.18);
        white-space:nowrap;
        pointer-events:none;
        animation:dataFloat ${duration}s linear forwards;
        letter-spacing:0.08em;
      `;
      container.appendChild(el);
      pool.push(el);
      setTimeout(() => {
        el.remove();
        const idx = pool.indexOf(el);
        if (idx > -1) pool.splice(idx, 1);
      }, duration * 1000);
    };

    const interval = setInterval(spawn, 2000);
    spawn(); // immediate first
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 5, overflow: "hidden" }}
    />
  );
}
