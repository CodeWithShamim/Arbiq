"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SUBMITTED_MSGS = [
  "Submitting to GenLayer...", "Broadcasting to mempool...", "Signing with your key...",
  "Entering the blockchain...", "Casting your fate...",
];
const VALIDATING_MSGS = [
  "AI validators are waking up...", "⚖️ Judges reviewing evidence...", "🤖 LLM oracles deliberating...",
  "Consensus forming...", "Cross-examining the contract...", "Checking for contradictions...",
  "Running optimistic democracy...", "Validators arguing loudly...",
];
const FINALIZED_MSGS = { approved: ["VERDICT: APPROVED ✓", "Justice served!", "The court has spoken."], disputed: ["VERDICT: DISPUTED ✗", "The court is displeased.", "Request a retrial?"] };

type Stage = "submitted" | "validating" | "finalized";
type Result = "approved" | "disputed" | null;

interface Props {
  visible: boolean;
  stage: Stage;
  result?: Result;
  onClose?: () => void;
  txHash?: string;
}

export function TxModal({ visible, stage, result = null, onClose, txHash }: Props) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string }[]>([]);

  const msgs = stage === "submitted" ? SUBMITTED_MSGS : stage === "validating" ? VALIDATING_MSGS : [];

  useEffect(() => {
    if (!visible || stage === "finalized") { setMsgIdx(0); return; }
    const i = setInterval(() => setMsgIdx((n) => (n + 1) % msgs.length), 1400);
    return () => clearInterval(i);
  }, [visible, stage, msgs.length]);

  useEffect(() => {
    if (stage === "finalized" && result === "disputed") {
      setShaking(true);
      setTimeout(() => setShaking(false), 700);
    }
    if (stage === "finalized" && result === "approved") {
      const pieces = Array.from({ length: 20 }, (_, i) => ({
        id: i, x: 20 + Math.random() * 60, color: ["#00f0ff","#00ff88","#ffd700","#ff00ff"][i % 4],
      }));
      setConfetti(pieces);
      setTimeout(() => setConfetti([]), 2800);
    }
  }, [stage, result]);

  const stageColor = stage === "finalized"
    ? (result === "approved" ? "#00ff88" : "#ff6b6b")
    : "#00f0ff";

  const progressPct = stage === "submitted" ? 33 : stage === "validating" ? 66 : 100;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          style={{
            position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "min(480px, 96vw)",
            zIndex: 9500,
            background: "rgba(0,0,0,0.96)",
            border: `1px solid ${stageColor}44`,
            borderBottom: "none",
            borderRadius: "16px 16px 0 0",
            padding: "28px 28px 36px",
            fontFamily: '"JetBrains Mono",monospace',
            boxShadow: `0 -8px 40px ${stageColor}22`,
          }}
        >
          {/* Confetti overlay */}
          {confetti.map((c) => (
            <motion.div
              key={c.id}
              initial={{ x: `${c.x}%`, y: 0, opacity: 1, rotate: 0 }}
              animate={{ y: -200, opacity: 0, rotate: 360 }}
              transition={{ duration: 1.8 + Math.random() * 0.8, ease: "easeOut" }}
              style={{ position: "absolute", top: "50%", left: 0, width: 8, height: 8, background: c.color, borderRadius: 2, pointerEvents: "none" }}
            />
          ))}

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: stageColor, boxShadow: `0 0 8px ${stageColor}`, animation: stage !== "finalized" ? "blink 0.9s infinite" : undefined }} />
            <span style={{ fontSize: 11, color: stageColor, letterSpacing: "0.2em", fontWeight: 700 }}>
              TRANSACTION {stage.toUpperCase()}
            </span>
            {onClose && stage === "finalized" && (
              <button
                onClick={onClose}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
              >×</button>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, marginBottom: 20, overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ height: "100%", background: `linear-gradient(to right, #00f0ff, ${stageColor})`, borderRadius: 1, boxShadow: `0 0 6px ${stageColor}` }}
            />
          </div>

          {/* Stage indicators */}
          <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
            {(["submitted", "validating", "finalized"] as Stage[]).map((s, i) => {
              const done = ["submitted","validating","finalized"].indexOf(stage) >= i;
              const active = stage === s;
              return (
                <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: done ? stageColor + "22" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${done ? stageColor : "rgba(255,255,255,0.1)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12,
                    boxShadow: active ? `0 0 12px ${stageColor}` : undefined,
                    transition: "all 0.4s",
                  }}>
                    {done ? (s === "finalized" ? (result === "approved" ? "✓" : "✗") : "✓") : (i + 1)}
                  </div>
                  <span style={{ fontSize: 8, color: done ? stageColor : "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
                    {s.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Message */}
          <AnimatePresence mode="wait">
            {stage !== "finalized" ? (
              <motion.div
                key={msgIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textAlign: "center", minHeight: 20 }}
              >
                {msgs[msgIdx]}
              </motion.div>
            ) : (
              <motion.div
                key="final"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 18 }}
                style={{ textAlign: "center" }}
              >
                <motion.div
                  animate={shaking ? { x: [-10, 10, -10, 10, -6, 6, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <div style={{ fontSize: 18, fontWeight: 700, color: stageColor, letterSpacing: "0.15em", textShadow: `0 0 20px ${stageColor}`, marginBottom: 8 }}>
                    {result === "approved" ? FINALIZED_MSGS.approved[0] : FINALIZED_MSGS.disputed[0]}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    {result === "approved" ? FINALIZED_MSGS.approved[1] : FINALIZED_MSGS.disputed[1]}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tx hash */}
          {txHash && (
            <div style={{ marginTop: 16, padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>TX HASH</div>
              <div style={{ fontSize: 9, color: "#00f0ff66", wordBreak: "break-all" }}>{txHash}</div>
            </div>
          )}

          {/* Spinner for in-progress */}
          {stage !== "finalized" && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 20, gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.3 }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#00f0ff" }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
