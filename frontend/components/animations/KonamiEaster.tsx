"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKonami } from "@/hooks/useKonami";

export function KonamiEaster() {
  const { activated, dismiss } = useKonami();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!activated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;
    const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number; size: number }> = [];
    const COLS = ["#00f0ff","#ff00ff","#00ff88","#ffd700","#ff6b6b"];

    for (let i = 0; i < 200; i++) {
      const angle = (Math.random() * 120 - 60) * Math.PI / 180; // -60 to +60 degrees from up
      const speed = 4 + Math.random() * 10;
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        color: COLS[Math.floor(Math.random() * COLS.length)],
        life: 1,
        size: 4 + Math.random() * 8,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.life -= 0.008;
        if (p.life <= 0) return;
        alive = true;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.life * 200).toString(16).padStart(2, "0");
        ctx.fill();
      });
      if (alive) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const t = setTimeout(dismiss, 5000);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [activated, dismiss]);

  return (
    <AnimatePresence>
      {activated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 99990, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          onClick={dismiss}
        >
          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ textAlign: "center", position: "relative", zIndex: 1, padding: "0 24px" }}
          >
            <div style={{ fontFamily: '"Bebas Neue",sans-serif', fontSize: "5vw", color: "#00f0ff", letterSpacing: "0.12em", textShadow: "0 0 40px #00f0ff", marginBottom: 16 }}>
              CHEAT CODE ACTIVATED
            </div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 14, color: "#00ff88", marginBottom: 8 }}>
              You found the secret. The AI validators are impressed.
            </div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
              All future verdicts will be... JUST KIDDING. Nice try.
            </div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 24 }}>
              [ click anywhere to dismiss ]
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
