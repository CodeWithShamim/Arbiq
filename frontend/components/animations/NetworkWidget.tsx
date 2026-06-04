"use client";
import { useEffect, useState } from "react";

interface NetStats {
  validators: number;
  pending: number;
  block: number;
  avgVerdict: string;
}

function roll(el: HTMLElement | null, val: string) {
  if (!el) return;
  el.style.transform = "translateY(-100%)";
  el.style.opacity = "0";
  setTimeout(() => {
    el.textContent = val;
    el.style.transition = "none";
    el.style.transform = "translateY(100%)";
    el.style.opacity = "0";
    requestAnimationFrame(() => {
      el.style.transition = "transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.25s";
      el.style.transform = "translateY(0)";
      el.style.opacity = "1";
    });
  }, 120);
}

export function NetworkWidget() {
  const [stats, setStats] = useState<NetStats>({ validators: 5, pending: 4, block: 4821094, avgVerdict: "11.2s" });
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const blinkI = setInterval(() => setBlink((b) => !b), 900);
    const statsI = setInterval(() => {
      setStats((s) => ({
        validators: 5,
        pending: 2 + Math.floor(Math.random() * 7),
        block: s.block + 1,
        avgVerdict: (10 + Math.random() * 4).toFixed(1) + "s",
      }));
    }, 5000);
    return () => { clearInterval(blinkI); clearInterval(statsI); };
  }, []);

  return (
    <div
      style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 200,
        width: 168,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-mid)",
        borderRadius: 10,
        backdropFilter: "blur(12px)",
        padding: "10px 12px",
        fontFamily: '"JetBrains Mono",monospace',
        fontSize: 10,
      }}
    >
      <div style={{ color: "#7c3aed", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8, fontSize: 9 }}>
        ◆ NETWORK STATUS
      </div>
      {[
        { label: "VALIDATORS", value: `${stats.validators}/5`, color: "#16a34a" },
        { label: "PENDING TXS", value: String(stats.pending), color: "#b45309" },
        { label: "LAST BLOCK", value: `#${stats.block.toLocaleString()}`, color: "#0369a1" },
        { label: "AVG VERDICT", value: stats.avgVerdict, color: "#7c3aed" },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
          <span style={{ color: "var(--text-muted)", fontSize: 9 }}>{label}</span>
          <span style={{ color, fontSize: 10, fontWeight: 700, overflow: "hidden", height: 14, display: "inline-block" }}>
            {label === "VALIDATORS" && (
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", marginRight: 4, boxShadow: "0 0 5px rgba(34,197,94,0.6)", opacity: blink ? 1 : 0.4, transition: "opacity 0.3s" }} />
            )}
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
