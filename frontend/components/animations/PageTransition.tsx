"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const SLAB_COLORS = ["#00f0ff","#ff00ff","transparent","transparent","transparent","#00ff88","transparent","transparent","#ffd700","transparent","transparent","#ff00ff"];
const N_SLABS = 12;

let transitionIndex = 0;

export function PageTransition({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [txType, setTxType] = useState(0);
  const [gavelVisible, setGavelVisible] = useState(false);
  const [matrixActive, setMatrixActive] = useState(false);
  const prevPath = useRef(pathname);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    const t = transitionIndex % 5;
    transitionIndex++;
    setTxType(t);
    setIsTransitioning(true);
    if (t === 3) setGavelVisible(true);
    if (t === 4) setMatrixActive(true);
    setTimeout(() => {
      setIsTransitioning(false);
      setGavelVisible(false);
      setMatrixActive(false);
    }, 700);
  }, [pathname]);

  // Matrix rain effect
  useEffect(() => {
    if (!matrixActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;
    const cols = Math.floor(canvas.width / 14);
    const drops = Array.from({ length: cols }, () => 0);
    const chars = "ARBIQGENLAYOR0123456789ABCDEF!@#$%^&*";

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff88";
      ctx.font = "13px JetBrains Mono, monospace";
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * 14, y * 14);
        if (y * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        else drops[i]++;
      });
    };
    const interval = setInterval(draw, 35);
    return () => clearInterval(interval);
  }, [matrixActive]);

  return (
    <>
      {children}

      {/* TRANSITION A — Glitch horizontal slabs */}
      <AnimatePresence>
        {isTransitioning && txType === 0 && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9990, pointerEvents: "none" }}>
            {Array.from({ length: N_SLABS }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: [0, 1, 1, 0] }}
                transition={{ duration: 0.5, times: [0, 0.4, 0.6, 1], delay: i * 0.018, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  left: 0, right: 0,
                  top: `${(i / N_SLABS) * 100}%`,
                  height: `${100 / N_SLABS}%`,
                  background: SLAB_COLORS[i] === "transparent" ? "rgba(5,5,10,0.95)" : SLAB_COLORS[i],
                  transformOrigin: i % 2 === 0 ? "left" : "right",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* TRANSITION B — Vertical pixel wipe */}
      <AnimatePresence>
        {isTransitioning && txType === 1 && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9990, pointerEvents: "none", display: "flex" }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0, originY: 0 }}
                animate={{ scaleY: [0, 0.5 + Math.random() * 0.5, 0] }}
                transition={{ duration: 0.5, delay: i * 0.012, ease: "easeInOut" }}
                style={{
                  flex: 1,
                  height: "100%",
                  background: `hsl(${i * 18},80%,50%)`,
                  opacity: 0.85,
                  transformOrigin: "top",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* TRANSITION C — Radial conic explosion */}
      <AnimatePresence>
        {isTransitioning && txType === 2 && (
          <motion.div
            initial={{ clipPath: "circle(0% at 50% 50%)" }}
            animate={{ clipPath: ["circle(0% at 50% 50%)", "circle(75% at 50% 50%)", "circle(0% at 50% 50%)"] }}
            transition={{ duration: 0.6, times: [0, 0.5, 1], ease: "easeInOut" }}
            style={{
              position: "fixed", inset: 0, zIndex: 9990, pointerEvents: "none",
              background: "conic-gradient(#00f0ff,#ff00ff,#00ff88,#ffd700,#00f0ff)",
            }}
          />
        )}
      </AnimatePresence>

      {/* TRANSITION D — Court gavel bang */}
      <AnimatePresence>
        {isTransitioning && txType === 3 && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9990, pointerEvents: "none" }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.12, times: [0, 0.3, 1] }}
              style={{ position: "absolute", inset: 0, background: "white" }}
            />
            {gavelVisible && (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 0.5, times: [0, 0.4, 0.7, 1] }}
                  style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.9)" }}
                >
                  <div style={{ fontSize: 120 }}>⚖️</div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -10] }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{ fontFamily: '"Bebas Neue",sans-serif', fontSize: 48, color: "#00f0ff", letterSpacing: "0.15em", marginTop: 16 }}
                  >
                    CASE FILED
                  </motion.div>
                </motion.div>
              </>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* TRANSITION E — Matrix rain */}
      {matrixActive && (
        <canvas
          ref={canvasRef}
          style={{ position: "fixed", inset: 0, zIndex: 9990, pointerEvents: "none" }}
        />
      )}
    </>
  );
}
