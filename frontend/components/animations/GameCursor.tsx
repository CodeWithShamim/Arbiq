"use client";
import { useEffect, useRef, useState } from "react";

type CursorMode = "default" | "button" | "card" | "gavel" | "link" | "robot";

const TRAIL_LEN = 6;

export function GameCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<CursorMode>("default");
  const [mode, setMode] = useState<CursorMode>("default");

  const mx = useRef(0), my = useRef(0);
  const rx = useRef(0), ry = useRef(0);
  const trail = useRef<Array<{ x: number; y: number }>>([]);
  const trailDots = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle sparks on click
    const sparks: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];
    const COLORS = ["#00f0ff", "#ff00ff", "#00ff88", "#ffd700"];

    const onClick = (e: MouseEvent) => {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const speed = 3 + Math.random() * 4;
        sparks.push({
          x: e.clientX, y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: COLORS[i % COLORS.length],
        });
      }
    };
    window.addEventListener("click", onClick);

    const updateMode = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const attr = target.closest("[data-cursor]")?.getAttribute("data-cursor")
        ?? (target.closest("button,a") ? "button"
          : target.closest("[data-card]") ? "card"
          : "default");
      const m = attr as CursorMode;
      modeRef.current = m;
      setMode(m);
    };
    window.addEventListener("mousemove", updateMode);

    const onMove = (e: MouseEvent) => {
      mx.current = e.clientX;
      my.current = e.clientY;
      trail.current.unshift({ x: e.clientX, y: e.clientY });
      if (trail.current.length > TRAIL_LEN) trail.current.pop();
    };
    window.addEventListener("mousemove", onMove);

    let raf: number;
    let ringAngle = 0;

    const loop = () => {
      // Lerp ring
      rx.current += (mx.current - rx.current) * 0.1;
      ry.current += (my.current - ry.current) * 0.1;
      ringAngle += 1.2;

      const dot = dotRef.current;
      const ring = ringRef.current;
      const label = labelRef.current;

      if (dot) {
        dot.style.left = `${mx.current}px`;
        dot.style.top = `${my.current}px`;
      }
      if (ring) {
        ring.style.left = `${rx.current}px`;
        ring.style.top = `${ry.current}px`;
        ring.style.transform = `translate(-50%,-50%) rotate(${ringAngle}deg)`;
      }
      if (label) {
        label.style.left = `${mx.current + 16}px`;
        label.style.top = `${my.current - 8}px`;
      }

      // Trail dots
      trailDots.current.forEach((td, i) => {
        const t = trail.current[i];
        if (!t || !td) return;
        td.style.left = `${t.x}px`;
        td.style.top = `${t.y}px`;
        td.style.opacity = String(((TRAIL_LEN - i) / TRAIL_LEN) * 0.45);
      });

      // Sparks
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * 3;
        s.y += s.vy * 3;
        s.vy += 0.15; // gravity
        s.life -= 0.035;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3 * s.life, 0, Math.PI * 2);
        ctx.fillStyle = s.color + Math.floor(s.life * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("click", onClick);
      window.removeEventListener("mousemove", updateMode);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const modeStyles = {
    default: { dot: { width: 8, height: 8, background: "#00f0ff", borderRadius: "50%", mixBlendMode: "difference" as const }, ring: { width: 32, height: 32, border: "1.5px solid #00f0ff", borderRadius: "50%" }, label: null },
    button: { dot: { width: 12, height: 12, background: "#00ff88", borderRadius: "2px", transform: "rotate(45deg)" }, ring: { width: 56, height: 56, border: "2px solid #00ff88", borderRadius: "50%", animation: "ringPulse 0.8s ease-in-out infinite" }, label: "CLICK TO EXECUTE" },
    card: { dot: { width: 20, height: 20, background: "transparent", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }, ring: { width: 44, height: 44, border: "1.5px solid #00f0ff66", borderRadius: "50%" }, label: null },
    gavel: { dot: { width: 20, height: 20, background: "transparent", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", animation: "gavBounce 0.4s ease-in-out infinite alternate" }, ring: { width: 40, height: 40, border: "2px solid #ef4444", borderRadius: "50%", animation: "flicker 0.15s step-end infinite" }, label: null },
    link: { dot: { width: 40, height: 4, background: "#ffd700", borderRadius: 2 }, ring: { width: 44, height: 44, border: "1.5px solid #ffd70066", borderRadius: "50%" }, label: null },
    robot: { dot: { width: 20, height: 20, background: "transparent", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", animation: "robotFlicker 0.5s step-end infinite" }, ring: { width: 36, height: 36, border: "1.5px solid #a78bfa", borderRadius: "50%" }, label: null },
  };

  const s = modeStyles[mode];

  return (
    <>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99998 }} />
      <div ref={dotRef} style={{ position: "fixed", pointerEvents: "none", zIndex: 99999, transform: "translate(-50%,-50%)", transition: "width 0.12s,height 0.12s,background 0.12s,border-radius 0.12s", ...s.dot }}>
        {mode === "card" && "🔍"}
        {mode === "gavel" && "⚖️"}
        {mode === "robot" && "🤖"}
      </div>
      <div ref={ringRef} style={{ position: "fixed", pointerEvents: "none", zIndex: 99997, transition: "width 0.2s,height 0.2s,border-color 0.2s", ...s.ring }} />
      {s.label && (
        <div ref={labelRef} style={{ position: "fixed", pointerEvents: "none", zIndex: 99999, fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: "#00ff88", whiteSpace: "nowrap", letterSpacing: "0.1em" }}>
          {s.label}
        </div>
      )}
      {/* Trail dots (card mode) */}
      {mode === "card" && Array.from({ length: TRAIL_LEN }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { if (el) trailDots.current[i] = el; }}
          style={{ position: "fixed", pointerEvents: "none", zIndex: 99996, width: 6 - i * 0.6, height: 6 - i * 0.6, borderRadius: "50%", background: "#00f0ff", transform: "translate(-50%,-50%)", transition: "opacity 0.05s" }}
        />
      ))}
    </>
  );
}
