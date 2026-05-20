"use client";
import { useEffect, useState } from "react";

const SECTIONS = ["Hero","Marquee","Compare","Features","AI Verdict","How It Works","FAQ","CTA"];
const TICKS = [0, 20, 40, 60, 80, 100];

export function ScrollProgress() {
  const [pct, setPct] = useState(0);
  const [section, setSection] = useState("Hero");

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setPct(p);
      const idx = Math.floor((p / 100) * (SECTIONS.length - 1));
      setSection(SECTIONS[Math.min(idx, SECTIONS.length - 1)]);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        position: "fixed", left: 8, top: "50%", transform: "translateY(-50%)",
        zIndex: 200, display: "flex", alignItems: "center", gap: 6,
        pointerEvents: "none",
      }}
    >
      {/* Bar track */}
      <div style={{ position: "relative", width: 4, height: 200, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
        {/* Fill */}
        <div
          style={{
            position: "absolute", left: 0, top: 0, right: 0,
            height: `${pct}%`,
            background: "linear-gradient(to bottom,#00f0ff,#00ff88)",
            borderRadius: 2,
            boxShadow: "0 0 8px #00f0ff88",
            transition: "height 0.1s linear",
          }}
        />
        {/* Tick marks */}
        {TICKS.map((t) => (
          <div key={t} style={{ position: "absolute", left: -2, right: -2, top: `${t}%`, height: 1, background: "rgba(0,240,255,0.25)" }} />
        ))}
        {/* Diamond indicator */}
        <div
          style={{
            position: "absolute", left: "50%", transform: "translateX(-50%) rotate(45deg)",
            width: 8, height: 8,
            background: "#00f0ff",
            boxShadow: "0 0 10px #00f0ff",
            top: `calc(${pct}% - 4px)`,
            transition: "top 0.1s linear",
          }}
        />
      </div>
      {/* Section label */}
      <div
        style={{
          fontFamily: '"JetBrains Mono",monospace',
          fontSize: 9,
          color: "rgba(0,240,255,0.6)",
          letterSpacing: "0.1em",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: "rotate(180deg)",
          userSelect: "none",
        }}
      >
        {section.toUpperCase()}
      </div>
    </div>
  );
}
